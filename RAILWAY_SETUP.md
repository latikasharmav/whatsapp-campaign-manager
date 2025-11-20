# Railway Deployment Setup Guide

## Critical: Environment Variables Configuration

**IMPORTANT**: The `.env` file in your local project is **NOT** automatically used by Railway. You **MUST** manually configure these environment variables in the Railway dashboard.

### How to Set Environment Variables on Railway

1. Go to your Railway project dashboard
2. Click on your service (whatsapp-campaign-manager)
3. Go to the **"Variables"** tab
4. Click **"+ New Variable"** for each variable below
5. After adding all variables, click **"Deploy"** to restart the service

---

## Required Environment Variables

### 1. NODE_ENV
**Value**: `production`

**Why**: Enables production mode with secure cookies and optimized performance

```
NODE_ENV=production
```

---

### 2. DOMAIN_URL
**Value**: `https://whatsapp-campaign-manager-production.up.railway.app`

**Important**: Use your **actual Railway URL**, not LocalTunnel!

To find your Railway URL:
- Go to Railway dashboard → Settings → Domains
- Copy the `.railway.app` domain
- Or use your custom domain if you've set one up

```
DOMAIN_URL=https://YOUR-PROJECT-NAME.up.railway.app
```

---

### 3. ADMIN_PASSWORD
**Value**: Choose a **strong, unique password**

**Security**: Change this from the default! Do NOT use `SecureAdmin2024`

Example (use your own):
```
ADMIN_PASSWORD=YourSecurePassword123!@#
```

---

### 4. SESSION_SECRET
**Value**: A **random string** (minimum 32 characters)

**Security**: Generate a new random secret! Do NOT use the default from .env

Generate a secure secret:
```bash
# On Mac/Linux:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use this example (but generate your own!):
SESSION_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

### 5. RATE_LIMIT_MINUTES
**Value**: `1`

**Why**: Time window for rate limiting (1 minute)

```
RATE_LIMIT_MINUTES=1
```

---

### 6. RATE_LIMIT_MAX_REQUESTS
**Value**: `20`

**Why**: Maximum QR code scans per IP per minute

**Note**: Increased from 5 to 20 to prevent blocking during testing

```
RATE_LIMIT_MAX_REQUESTS=20
```

---

### 7. PORT (Optional)
**Value**: Railway sets this automatically

**Note**: You don't need to set this - Railway provides it automatically

---

## Complete Railway Variables Checklist

Copy these values to Railway Variables tab:

```
NODE_ENV=production
DOMAIN_URL=https://YOUR-PROJECT-NAME.up.railway.app
ADMIN_PASSWORD=YourSecurePassword123!
SESSION_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
RATE_LIMIT_MINUTES=1
RATE_LIMIT_MAX_REQUESTS=20
```

---

## Database Configuration (Automatic)

Railway automatically provides these variables when you attach a PostgreSQL database:
- `DATABASE_URL` or `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

**Your app automatically detects these** - no manual configuration needed!

---

## After Setting Variables

1. Click **"Deploy"** in Railway dashboard
2. Wait for deployment to complete (2-3 minutes)
3. Check deployment logs for any errors
4. Test the `/join` endpoint: `https://YOUR-APP.railway.app/join`
5. Generate a new QR code from admin panel
6. Test scanning with iPhone

---

## Common Issues

### Issue: "All Groups Are Full" message appears
**Solution**:
- Check your database has active groups with capacity
- Run seed script: `npm run seed:railway` (if available)
- Or manually add groups via admin panel

### Issue: "Too many requests" error
**Solution**:
- Verify `RATE_LIMIT_MAX_REQUESTS=20` is set on Railway
- Wait 1 minute and try again
- Check Railway logs for rate limit messages

### Issue: Redirect not working on Safari/iPhone
**Solution**:
- Verify `DOMAIN_URL` is correct Railway URL (not LocalTunnel)
- Check Railway logs for `[JOIN]` messages
- Ensure WhatsApp group links in database are valid
- Try accessing `/join` directly in Safari to see the redirect page

### Issue: Session/cookie errors
**Solution**:
- Verify `NODE_ENV=production` is set
- Verify `SESSION_SECRET` is set (minimum 32 characters)
- Railway URL must use HTTPS (it does by default)

---

## Viewing Railway Logs

To debug issues, view real-time logs:

1. Go to Railway dashboard
2. Click on your service
3. Go to **"Deployments"** tab
4. Click on the latest deployment
5. View the logs in real-time

Look for:
- `[JOIN]` messages showing redirect attempts
- Error messages from `/join` endpoint
- Rate limiting warnings
- Database connection issues

---

## Testing Checklist

After configuring environment variables:

- [ ] Railway deployment succeeded
- [ ] Admin panel accessible at `/admin`
- [ ] Can login with new ADMIN_PASSWORD
- [ ] Dashboard shows statistics
- [ ] Can generate QR code
- [ ] QR code URL points to Railway domain (not LocalTunnel)
- [ ] Scanning QR code opens redirect page
- [ ] Redirect page auto-redirects to WhatsApp
- [ ] Manual button works if auto-redirect fails
- [ ] Check Railway logs show `[JOIN]` messages
- [ ] WhatsApp group opens successfully

---

## Security Notes

1. **Never commit** environment variables to Git
2. **Change default passwords** before production use
3. **Use strong SESSION_SECRET** (minimum 32 random characters)
4. **Keep Railway variables private** - only share with authorized team members
5. **Rotate secrets regularly** for production apps

---

## Need Help?

If you're still experiencing issues:

1. Check Railway deployment logs for errors
2. Verify all environment variables are set correctly
3. Test `/join` endpoint directly in browser
4. Check database connection (view `/health` endpoint)
5. Ensure WhatsApp group links are valid and active

---

## Your Current Railway URL

Based on your codebase, your Railway URL is:
```
https://whatsapp-campaign-manager-production.up.railway.app
```

**Make sure to verify this in Railway dashboard** and update `DOMAIN_URL` if it's different!
