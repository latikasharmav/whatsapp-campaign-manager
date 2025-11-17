# Quick Start Guide

## Your WhatsApp Campaign Manager is Ready!

The server is currently running at **http://localhost:3000**

## Access Points

### Admin Panel
**URL**: http://localhost:3000/admin.html
**Password**: `SecureAdmin2024`

### Join/Redirect URL
**URL**: http://localhost:3000/join
This is the URL your QR code should point to.

### Health Check
**URL**: http://localhost:3000/health

## What's Already Set Up

Your database has been seeded with:
- **20 Sample Groups** (Indian city-based campaigns)
- **1,414 Scan Records** (last 30 days)
- **16 Active Groups**
- **4 Inactive Groups**
- **Total Capacity**: 13,263 members
- **Current Members**: 1,121 (8.45% fill rate)

## Quick Tour

### 1. Dashboard
- View real-time statistics
- Monitor recent scans
- Track fill rates

### 2. Groups Management
- Add/Edit/Delete groups
- Set capacity (max 1024 per WhatsApp group limit)
- Toggle active/inactive status
- Reset member counts
- View fill rates with visual progress bars

### 3. Analytics
- Scans per day (7-day chart)
- Scans per hour (24-hour chart)
- Top performing groups
- Device breakdown (Mobile vs Desktop)

### 4. QR Code Generator
- Generate QR codes in 3 sizes
- Download as PNG
- Share with your audience

## Server Commands

### Start Server
```bash
npm start
```

### Start with Auto-Reload (Development)
```bash
npm run dev
```

### Seed Database (Reset & Populate)
```bash
# Delete database.sqlite first, then:
npm run seed
```

### Backup Database
```bash
npm run backup
```

### Stop Server
```bash
# Press Ctrl+C in the terminal
```

## Important Files

| File | Purpose |
|------|---------|
| `.env` | Configuration (passwords, ports, etc.) |
| `database.sqlite` | Your database file |
| `server.js` | Main server code |
| `database.js` | Database operations |
| `public/admin.html` | Admin interface |
| `README.md` | Full documentation |

## Next Steps

1. **Change Admin Password**
   - Edit `.env` file
   - Change `ADMIN_PASSWORD` value
   - Restart server

2. **Add Your Groups**
   - Login to admin panel
   - Click "Add Group"
   - Enter group name, WhatsApp link, and capacity
   - Get WhatsApp links from your group settings

3. **Generate QR Code**
   - Go to QR Code page
   - Select size
   - Click "Generate"
   - Download and share

4. **Share Your Join Link**
   - http://localhost:3000/join
   - Or use the QR code

## Testing the System

1. **Test Redirect**
   - Visit http://localhost:3000/join in browser
   - Should redirect to a WhatsApp group

2. **View Scan Log**
   - Login to admin panel
   - Check dashboard for new scan

3. **Check Group Count**
   - Group count should increment by 1

## Common Tasks

### Add a New Group
```
1. Login to admin panel
2. Click "Groups" in navigation
3. Click "Add Group" button
4. Fill in:
   - Name: "Your Campaign Name"
   - WhatsApp Link: https://chat.whatsapp.com/...
   - Capacity: 1000 (or your desired limit)
5. Click "Save Group"
```

### Reset a Group Count
```
1. Go to Groups page
2. Find your group
3. Click "Reset Count" button
4. Confirm the action
```

### Deactivate a Full Group
```
1. Go to Groups page
2. Find the full group
3. Click "Deactivate" button
4. Group will stop receiving new members
```

### Export Data
```
1. Go to Analytics page
2. Click "Export Data" button
3. JSON file will download with all data
```

## Security Notes

**IMPORTANT**: Before deploying to production:

1. Change `ADMIN_PASSWORD` in `.env`
2. Change `SESSION_SECRET` in `.env`
3. Update `DOMAIN_URL` to your actual domain
4. Set `NODE_ENV=production`
5. Use HTTPS (not HTTP)

## Rate Limiting

The `/join` endpoint is rate-limited to prevent abuse:
- **Default**: 5 requests per minute per IP
- **Configurable** in `.env` file

## Support

- Full documentation: `README.md`
- Troubleshooting: See README.md Troubleshooting section
- Check server logs for errors

## Pro Tips

1. **Monitor Fill Rates**: Keep groups at 80-90% capacity for best performance
2. **Rotate Groups**: Deactivate full groups and activate new ones
3. **Regular Backups**: Run `npm run backup` weekly
4. **Analytics Review**: Check analytics daily to optimize campaigns
5. **QR Code Size**: Use "Large" for print, "Medium" for digital

## Current Status

Server Status: RUNNING ✅
Port: 3000
Environment: Development
Database: SQLite (database.sqlite)

## Stopping the Server

To stop the server:
1. Go to the terminal where server is running
2. Press `Ctrl + C`
3. Wait for graceful shutdown

---

**Enjoy your WhatsApp Campaign Manager!**

For detailed documentation, see `README.md`
