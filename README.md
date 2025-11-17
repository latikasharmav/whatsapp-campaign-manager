# WhatsApp Campaign Manager

A complete QR code redirect system that automatically distributes users across multiple WhatsApp groups. When someone scans a single QR code, the system intelligently checks which group has capacity and redirects them to that group's WhatsApp invite link.

## Features

- **Smart Group Distribution**: Automatically distributes users to available groups
- **Admin Dashboard**: Comprehensive analytics and management interface
- **QR Code Generation**: Create QR codes for easy sharing
- **Real-time Analytics**: Track scans, device types, and group performance
- **Rate Limiting**: Prevent abuse with built-in rate limiting
- **Secure Admin Panel**: Password-protected admin access
- **Mobile Responsive**: Works perfectly on all devices
- **Production Ready**: Built for scale with proper error handling

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: SQLite (easy local development, can migrate to PostgreSQL/MySQL)
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Charts**: Chart.js for analytics visualization
- **QR Codes**: qrcode library
- **Security**: Helmet, rate-limit, express-session

## Quick Start

### Prerequisites

- Node.js 14.0 or higher
- npm or yarn

### Installation

1. **Clone or download the project**

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

The `.env` file is already created with default values:
```env
PORT=3000
ADMIN_PASSWORD=SecureAdmin2024
DOMAIN_URL=http://localhost:3000
SESSION_SECRET=xJ3kL9mN2pQ5rS8tV4wX7yA1bC6dE0f
RATE_LIMIT_MINUTES=1
RATE_LIMIT_MAX_REQUESTS=5
NODE_ENV=development
```

**Important**: Change `ADMIN_PASSWORD` and `SESSION_SECRET` for production!

4. **Seed the database with sample data**
```bash
npm run seed
```

This will create:
- 20 sample WhatsApp groups with Indian city names
- Random scan data for the last 30 days
- Sample settings

5. **Start the server**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

6. **Access the application**
- Main redirect URL: http://localhost:3000/join
- Admin Panel: http://localhost:3000/admin.html
- Admin Password: `SecureAdmin2024`

## Project Structure

```
whatsapp-campaign/
├── server.js              # Main server file
├── database.js            # Database operations
├── seed.js                # Database seeding script
├── backup.js              # Database backup script
├── package.json           # Dependencies
├── .env                   # Environment variables
├── .gitignore            # Git ignore file
├── database.sqlite        # SQLite database (created automatically)
├── public/                # Frontend files
│   ├── admin.html        # Admin panel
│   ├── style.css         # Styles
│   └── script.js         # Frontend JavaScript
└── README.md             # This file
```

## How It Works

### User Flow

1. User scans QR code pointing to `/join`
2. System checks active groups with available capacity
3. System logs the scan (IP, device, timestamp)
4. System increments group count
5. User is redirected to the WhatsApp group invite link
6. If all groups are full, user sees a friendly message

### Admin Features

#### Dashboard
- Total groups, capacity, and members
- Fill rate with visual progress bar
- Total scans and unique visitors
- Recent scan activity

#### Groups Management
- Add new groups with name, WhatsApp link, and capacity
- Edit existing groups
- Activate/deactivate groups
- Reset member counts
- Delete groups
- Visual progress bars for each group

#### Analytics
- **Scans per day** (last 7 days) - Bar chart
- **Scans per hour** (last 24 hours) - Line chart
- **Top performing groups** - Horizontal bar chart
- **Device breakdown** (Mobile vs Desktop) - Doughnut chart

#### QR Code Generator
- Generate QR codes in different sizes (small, medium, large)
- Download QR codes as PNG images
- Display join URL

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/join` | Main redirect endpoint (rate-limited) |
| GET | `/health` | System health check |

### Admin Endpoints (Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/login` | Login to admin panel |
| POST | `/admin/logout` | Logout from admin panel |
| GET | `/admin/check-auth` | Check authentication status |
| GET | `/admin/stats` | Get dashboard statistics |
| GET | `/admin/groups` | Get all groups |
| POST | `/admin/groups` | Create new group |
| PUT | `/admin/groups/:id` | Update group |
| DELETE | `/admin/groups/:id` | Delete group |
| POST | `/admin/groups/:id/reset` | Reset group count |
| POST | `/admin/groups/:id/toggle` | Toggle group active status |
| GET | `/admin/analytics` | Get analytics data |
| GET | `/admin/qrcode` | Generate QR code |
| GET | `/admin/export` | Export all data as JSON |

## Database Schema

### Groups Table
```sql
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- whatsapp_link (TEXT)
- capacity (INTEGER DEFAULT 1000)
- current_count (INTEGER DEFAULT 0)
- is_active (BOOLEAN DEFAULT 1)
- created_at (TIMESTAMP)
```

### Scans Table
```sql
- id (INTEGER PRIMARY KEY)
- group_id (INTEGER FOREIGN KEY)
- ip_address (TEXT)
- user_agent (TEXT)
- scan_time (TIMESTAMP)
- referred_from (TEXT)
```

### Settings Table
```sql
- id (INTEGER PRIMARY KEY)
- key (TEXT UNIQUE)
- value (TEXT)
- updated_at (TIMESTAMP)
```

## Security Features

- **Password Protection**: Admin panel requires authentication
- **Session Management**: Secure session handling with httpOnly cookies
- **Rate Limiting**: Prevents abuse on join endpoint (5 requests/minute by default)
- **Helmet.js**: Security headers
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: HTML escaping on frontend
- **CORS**: Configurable CORS settings

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| ADMIN_PASSWORD | Admin panel password | SecureAdmin2024 |
| DOMAIN_URL | Your domain URL | http://localhost:3000 |
| SESSION_SECRET | Session encryption secret | (random string) |
| RATE_LIMIT_MINUTES | Rate limit window | 1 |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | 5 |
| NODE_ENV | Environment | development |

### WhatsApp Group Limits

WhatsApp groups have a maximum capacity of **1024 members**. The system enforces this limit.

## Backup and Restore

### Create Backup

```bash
npm run backup
```

This creates a JSON backup in the `backups/` directory with:
- All groups
- All scans
- All settings
- Timestamp

### Restore from Backup

Backups are in JSON format. To restore:

1. Stop the server
2. Delete or rename `database.sqlite`
3. Start the server (creates new database)
4. Manually import data using the admin panel or write a restore script

## Deployment

### Preparing for Production

1. **Update environment variables**
```env
NODE_ENV=production
ADMIN_PASSWORD=YourSecurePassword123!
SESSION_SECRET=YourRandomSecretKey456
DOMAIN_URL=https://yourdomain.com
```

2. **Use a process manager**

Install PM2:
```bash
npm install -g pm2
```

Start with PM2:
```bash
pm2 start server.js --name whatsapp-campaign
pm2 save
pm2 startup
```

3. **Set up reverse proxy** (Nginx example)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Hosting Platforms

This application can be deployed to:

- **Railway**: Zero-config deployment
- **Heroku**: With PostgreSQL addon
- **DigitalOcean**: App Platform or Droplet
- **AWS**: EC2 or Elastic Beanstalk
- **Google Cloud**: App Engine or Compute Engine
- **Azure**: App Service
- **Render**: Free tier available
- **Fly.io**: Global edge deployment

### Database Migration

For production, consider migrating from SQLite to PostgreSQL or MySQL:

1. Update database.js to use your preferred database
2. Install appropriate driver (pg for PostgreSQL, mysql2 for MySQL)
3. Update connection settings
4. Run migrations

## Troubleshooting

### Database locked error
- Close all connections to the database
- Restart the server
- If using SQLite Browser, close it

### QR Code not generating
- Check browser console for errors
- Ensure Chart.js CDN is accessible
- Clear browser cache

### Groups not showing
- Check database has data (run seed script)
- Check browser console for API errors
- Verify authentication

### Rate limit errors
- Increase RATE_LIMIT_MAX_REQUESTS in .env
- Clear browser cookies
- Wait for rate limit window to reset

### Port already in use
- Change PORT in .env file
- Or kill the process using the port:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

## Performance Optimization

The system is optimized for handling 20,000+ users:

- **Database Indexing**: Indexes on commonly queried fields
- **Response Compression**: Gzip compression enabled
- **Efficient Queries**: Optimized SQL queries
- **Rate Limiting**: Prevents server overload
- **Session Management**: Efficient session handling
- **Static File Serving**: Optimized static file delivery

## Monitoring

### Health Check

Monitor system health:
```bash
curl http://localhost:3000/health
```

Returns:
```json
{
  "status": "healthy",
  "uptime": 12345,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "stats": { ... }
}
```

### Logs

The application uses Morgan for HTTP logging. In production, consider:
- Rotating log files
- Centralized logging (LogDNA, Papertrail)
- Error tracking (Sentry, Rollbar)

## Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or suggestions:
- Check the troubleshooting section
- Review closed issues
- Open a new issue with detailed information

## Roadmap

Future enhancements:
- [ ] CSV import for bulk group creation
- [ ] Email notifications for full groups
- [ ] Custom branding options
- [ ] Multi-language support
- [ ] Advanced analytics filters
- [ ] Telegram integration
- [ ] API key authentication for external integrations
- [ ] Scheduled reports
- [ ] Group templates
- [ ] Auto-backup scheduling

## Credits

Built with:
- Express.js
- SQLite
- Chart.js
- QRCode.js
- Helmet.js
- And other amazing open-source libraries

---

**Note**: This system is for legitimate marketing campaigns only. Always comply with WhatsApp's Terms of Service and local regulations regarding bulk messaging and user privacy.
