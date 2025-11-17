# Hostinger Deployment Guide - WhatsApp Campaign Manager

## Step 1: Identify Your Hostinger Plan

Hostinger offers different hosting types. Check which one you have:

### Option 1: Shared Hosting (Most Common)
- WordPress hosting, Web hosting
- Does NOT support Node.js well
- **Not recommended for this app**

### Option 2: VPS Hosting (Best for Node.js)
- Virtual Private Server
- Full root access
- **Perfect for this app!** ✅

### Option 3: Cloud Hosting
- Managed cloud servers
- **Works well for this app!** ✅

## How to Check Your Plan:

1. Login to Hostinger Panel: https://hpanel.hostinger.com/
2. Look at your dashboard
3. Check what type it says:
   - "Shared Hosting" or "WordPress Hosting" → Option 1
   - "VPS" → Option 2
   - "Cloud Hosting" → Option 3

---

## If You Have VPS or Cloud Hosting (Recommended!)

Perfect! Your Node.js app will work great. Follow these steps:

### Deployment Options:

**Option A: Use Subdomain (Recommended)**
- Main site: `incpuducherry.in` (stays as is)
- WhatsApp app: `whatsapp.incpuducherry.in`
- Both run together! ✅

**Option B: Use New Free Domain**
- Main site: `incpuducherry.in` (stays as is)
- WhatsApp app: `your-new-domain.com`
- Completely separate ✅

**Option C: Use Subfolder** (Not ideal for Node.js)
- Main site: `incpuducherry.in`
- WhatsApp app: `incpuducherry.in/whatsapp`

---

## Recommended: Use Subdomain

This is the cleanest approach!

### Your URLs will be:
```
Main website:    https://incpuducherry.in
Admin Panel:     https://whatsapp.incpuducherry.in/admin.html
Join URL:        https://whatsapp.incpuducherry.in/join
```

---

## Complete Deployment Steps for VPS/Cloud

### Prerequisites:
- SSH access to your Hostinger VPS
- Node.js installed (v14 or higher)
- PM2 process manager
- Nginx for reverse proxy

### Step 1: Access Your Server via SSH

```bash
ssh root@your-server-ip
# Or use Hostinger's web SSH from hPanel
```

### Step 2: Install Node.js (if not installed)

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify installation
node -v
npm -v
```

### Step 3: Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### Step 4: Create Application Directory

```bash
# Create directory
mkdir -p /var/www/whatsapp-campaign
cd /var/www/whatsapp-campaign
```

### Step 5: Upload Your Application

**Option A: Using Git (Recommended)**

First, create a GitHub repository for your project:

1. Go to https://github.com/new
2. Create a new repository (e.g., "whatsapp-campaign")
3. Don't initialize with README

Then on your local computer:

```bash
cd "C:\Users\ravi\Documents\WhatsAppProject"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/whatsapp-campaign.git
git push -u origin main
```

Then on the server:

```bash
cd /var/www/whatsapp-campaign
git clone https://github.com/YOUR_USERNAME/whatsapp-campaign.git .
```

**Option B: Using FTP/SFTP**

1. Use FileZilla or WinSCP
2. Connect to your Hostinger VPS
3. Upload all files to `/var/www/whatsapp-campaign/`

**Option C: Using Hostinger File Manager**

1. Login to hPanel
2. Go to File Manager
3. Create folder `whatsapp-campaign`
4. Upload all files

### Step 6: Install Dependencies

```bash
cd /var/www/whatsapp-campaign
npm install --production
```

### Step 7: Configure Environment

```bash
nano .env
```

Update to:
```env
PORT=3000
ADMIN_PASSWORD=YourSecurePassword123!
DOMAIN_URL=https://whatsapp.incpuducherry.in
SESSION_SECRET=ChangeThisToRandomString123
RATE_LIMIT_MINUTES=1
RATE_LIMIT_MAX_REQUESTS=5
NODE_ENV=production
```

Save and exit (Ctrl+X, Y, Enter)

### Step 8: Seed Database (Optional - First Time Only)

```bash
npm run seed
```

### Step 9: Start Application with PM2

```bash
pm2 start server.js --name whatsapp-campaign
pm2 save
pm2 startup
```

Copy the command it outputs and run it to enable auto-start on reboot.

### Step 10: Configure Nginx Reverse Proxy

Create Nginx configuration:

```bash
nano /etc/nginx/sites-available/whatsapp.incpuducherry.in
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name whatsapp.incpuducherry.in;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/whatsapp.incpuducherry.in /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Step 11: Add Subdomain in Hostinger

1. Login to Hostinger hPanel
2. Go to "Domains" → Select `incpuducherry.in`
3. Click "DNS / Name Servers"
4. Add A Record:
   - Type: A
   - Name: whatsapp
   - Points to: Your VPS IP address
   - TTL: 3600
5. Save

Wait 5-10 minutes for DNS propagation.

### Step 12: Install SSL Certificate (HTTPS)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d whatsapp.incpuducherry.in

# Follow prompts, enter your email
# Choose option 2: Redirect HTTP to HTTPS
```

### Step 13: Test Your Deployment

Visit:
```
https://whatsapp.incpuducherry.in/health
```

You should see:
```json
{
  "status": "healthy",
  "uptime": 123,
  "database": "connected"
}
```

### Step 14: Access Admin Panel

Visit:
```
https://whatsapp.incpuducherry.in/admin.html
```

Login with your password and start managing groups!

---

## If You Have Shared Hosting (Alternative Solutions)

If you have shared hosting (not VPS), Node.js apps won't work well. Here are alternatives:

### Option 1: Upgrade to VPS
- Hostinger VPS starts at ~$4/month
- Much better for Node.js apps
- Full control

### Option 2: Deploy to Free/Cheap Node.js Hosts

**Railway (Recommended - Free tier)**
```
1. Go to railway.app
2. Connect GitHub
3. Deploy your repository
4. Automatic HTTPS and domain
```

**Render (Free tier)**
```
1. Go to render.com
2. Connect GitHub
3. Deploy as Web Service
4. Free SSL included
```

**Heroku (Paid, but reliable)**
```
1. Go to heroku.com
2. Install Heroku CLI
3. Deploy with Git
```

### Option 3: Use Your Hostinger Domain with External Hosting

You can:
- Deploy app to Railway/Render (free)
- Point your Hostinger domain to it
- Best of both worlds!

---

## Recommended Architecture

```
┌─────────────────────────────────────┐
│  incpuducherry.in                   │
│  (Your main website)                │
│  Stays on current hosting           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  whatsapp.incpuducherry.in          │
│  (WhatsApp Campaign Manager)        │
│  Node.js app on VPS/Railway         │
└─────────────────────────────────────┘
```

Both work independently!

---

## Post-Deployment Checklist

After deployment, verify:

- [ ] Admin panel accessible
- [ ] Can login with password
- [ ] Can add groups
- [ ] Can generate QR code
- [ ] /join redirects work
- [ ] Analytics loading
- [ ] HTTPS enabled (green padlock)
- [ ] Health check responds

---

## Maintenance Commands

### View Logs
```bash
pm2 logs whatsapp-campaign
```

### Restart App
```bash
pm2 restart whatsapp-campaign
```

### Stop App
```bash
pm2 stop whatsapp-campaign
```

### Update App
```bash
cd /var/www/whatsapp-campaign
git pull
npm install
pm2 restart whatsapp-campaign
```

### Backup Database
```bash
npm run backup
# Or manually:
cp database.sqlite backups/database-$(date +%Y%m%d).sqlite
```

### Monitor Resources
```bash
pm2 monit
```

---

## Security Recommendations

### 1. Firewall Setup
```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### 2. Disable Root Login
```bash
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
systemctl restart sshd
```

### 3. Regular Updates
```bash
apt update && apt upgrade -y
```

### 4. Monitor Logs
```bash
tail -f /var/log/nginx/error.log
pm2 logs
```

---

## Cost Comparison

### Hostinger VPS
- **VPS 1**: ~$4/month
- 1 vCPU, 4GB RAM
- Perfect for this app!

### Free Alternatives
- **Railway**: Free tier (500 hrs/month)
- **Render**: Free tier (limited)
- **Fly.io**: Free tier

### Recommended
If you already pay for Hostinger, check if you can upgrade to VPS.
Otherwise, Railway.app is excellent and free!

---

## Need Help?

Common issues and solutions in the troubleshooting section of README.md

For Hostinger-specific support:
- Hostinger Live Chat
- Hostinger Knowledge Base
- Check server logs: `pm2 logs`
