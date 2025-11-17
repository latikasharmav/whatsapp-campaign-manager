require('dotenv').config();
const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for Railway/Heroku and other proxy environments
app.set('trust proxy', 1);

// Initialize database
async function initializeDatabase() {
  try {
    await db.connect();
    await db.initialize();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for admin panel
}));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Required for HTTPS
  }
}));

// Rate limiting for join endpoint
const joinLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_MINUTES) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for admin endpoints
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many admin requests, please try again later.',
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'connected',
      stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Main redirect endpoint
app.get('/join', joinLimiter, async (req, res) => {
  try {
    // Get all active groups with available capacity
    const groups = await db.getActiveGroups();

    // Find first group with available capacity
    let targetGroup = null;
    for (const group of groups) {
      if (group.current_count < group.capacity) {
        targetGroup = group;
        break;
      }
    }

    if (!targetGroup) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Groups Full</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 500px;
            }
            h1 { color: #128C7E; margin-bottom: 20px; }
            p { color: #666; font-size: 18px; line-height: 1.6; }
            .icon { font-size: 64px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📱</div>
            <h1>All Groups Are Full</h1>
            <p>We're sorry, but all our WhatsApp groups have reached their capacity.</p>
            <p>Please contact the administrator for assistance.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Get request information
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'Unknown';
    const referredFrom = req.get('referer') || 'Direct';

    // Log the scan
    await db.addScan(targetGroup.id, ipAddress, userAgent, referredFrom);

    // Increment group count
    await db.incrementGroupCount(targetGroup.id);

    // Redirect to WhatsApp group
    res.redirect(targetGroup.whatsapp_link);

  } catch (error) {
    console.error('Error in join endpoint:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 500px;
          }
          h1 { color: #dc3545; margin-bottom: 20px; }
          p { color: #666; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚠️ Error</h1>
          <p>Something went wrong. Please try again later.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// Admin login endpoint
app.post('/admin/login', adminLimiter, (req, res) => {
  const { password } = req.body;

  if (password === process.env.ADMIN_PASSWORD) {
    req.session.authenticated = true;
    // Explicitly save session to ensure it persists
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ success: false, error: 'Session error' });
      }
      res.json({ success: true });
    });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

// Admin logout endpoint
app.post('/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to logout' });
    } else {
      res.json({ success: true });
    }
  });
});

// Check authentication status
app.get('/admin/check-auth', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

// Dashboard stats
app.get('/admin/stats', requireAuth, async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    const recentScans = await db.getRecentScans(10);
    res.json({ stats, recentScans });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Groups management
app.get('/admin/groups', requireAuth, async (req, res) => {
  try {
    const groups = await db.getAllGroups();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/groups', requireAuth, async (req, res) => {
  try {
    const { name, whatsappLink, capacity } = req.body;

    if (!name || !whatsappLink || !capacity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await db.addGroup(name, whatsappLink, parseInt(capacity));
    res.json({ success: true, id: result.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/admin/groups/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, whatsappLink, capacity, isActive } = req.body;

    await db.updateGroup(id, name, whatsappLink, parseInt(capacity), isActive ? 1 : 0);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/admin/groups/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteGroup(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/groups/:id/reset', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.resetGroupCount(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/groups/:id/toggle', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.toggleGroupStatus(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics endpoints
app.get('/admin/analytics', requireAuth, async (req, res) => {
  try {
    const scansPerDay = await db.getScansPerDay(7);
    const scansPerHour = await db.getScansPerHour(24);
    const topGroups = await db.getTopGroups(5);
    const deviceBreakdown = await db.getDeviceBreakdown();
    const stats = await db.getDashboardStats();

    res.json({
      scansPerDay,
      scansPerHour,
      topGroups,
      deviceBreakdown,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export data
app.get('/admin/export', requireAuth, async (req, res) => {
  try {
    const data = await db.exportAllData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=export-${Date.now()}.json`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// QR Code generation
const QRCode = require('qrcode');

app.get('/admin/qrcode', requireAuth, async (req, res) => {
  try {
    const { size = 'medium' } = req.query;
    const url = `${process.env.DOMAIN_URL}/join`;

    const sizeMap = {
      small: 200,
      medium: 400,
      large: 600
    };

    const qrSize = sizeMap[size] || 400;

    const qrCode = await QRCode.toDataURL(url, {
      width: qrSize,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({ qrCode, url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Not Found</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          text-align: center;
          max-width: 500px;
        }
        h1 { color: #128C7E; margin-bottom: 20px; font-size: 72px; margin: 0; }
        p { color: #666; font-size: 18px; }
        a { color: #25D366; text-decoration: none; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>404</h1>
        <p>Page not found</p>
        <p><a href="/">Go to Home</a></p>
      </div>
    </body>
    </html>
  `);
});

// Start server
async function startServer() {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   WhatsApp Campaign Manager                               ║
║                                                           ║
║   Server running on: http://localhost:${PORT}              ║
║   Admin Panel: http://localhost:${PORT}/admin.html        ║
║   Join URL: http://localhost:${PORT}/join                 ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV}                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await db.close();
  process.exit(0);
});

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
