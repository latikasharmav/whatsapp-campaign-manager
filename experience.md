# WhatsApp Campaign Manager - Experience & Knowledge Base

> **CRITICAL: READ THIS FILE COMPLETELY BEFORE MAKING ANY CHANGES TO THIS PROJECT**

---

## What This App Does

This is a **WhatsApp Group Redirect System** for political campaigns (currently used by Congress Party in Puducherry and Tamil Nadu).

### How It Works
1. User scans a QR code printed on marketing materials (posters, pamphlets, etc.)
2. QR code points to a URL like `https://domain.com/join` or `https://domain.com/join/tamilnadu`
3. Server finds an active WhatsApp group with available capacity
4. User is redirected to the WhatsApp group invite link
5. System tracks scans (analytics) and increments member count

### Business Value
- Physical QR codes are printed on **expensive marketing materials** (posters, banners, pamphlets)
- Once printed, **QR codes CANNOT be changed** - the URL must remain stable forever
- The system allows managing multiple groups behind a single URL
- When one group fills up, new scans automatically go to the next available group

---

## Architecture Overview

### Tech Stack
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (on Railway)
- **Hosting**: Railway.app
- **Frontend**: Vanilla HTML/CSS/JS (admin panel)

### Key Files
| File | Purpose |
|------|---------|
| `server.js` | Express server, routes, authentication, join logic |
| `database.js` | Database abstraction layer (PostgreSQL with SQLite fallback code) |
| `public/admin.html` | Admin panel UI |
| `public/script.js` | Admin panel JavaScript |
| `public/style.css` | Styles |

### Database Tables
1. **groups** - WhatsApp groups with name, invite link, capacity, current_count, campaign
2. **scans** - Every QR scan is logged (IP, user agent, timestamp, group)
3. **settings** - Key-value store for app settings

### URL Structure
| Campaign | URL | Notes |
|----------|-----|-------|
| Puducherry | `/join` | DEFAULT - backward compatible, never change! |
| Tamil Nadu | `/join/tamilnadu` | New campaigns use `/join/:campaign` pattern |
| Future campaigns | `/join/:campaignname` | Lowercase, no spaces |

---

## How to Scale (Add New Campaigns)

### Adding a New Campaign (e.g., Karnataka)

**NO CODE CHANGES TO `server.js` or `database.js` NEEDED!**

The system is already designed to handle any campaign name dynamically:

1. **Admin Panel HTML** (`public/admin.html`):
   - Add option to `campaignFilter` dropdown (Groups page, line ~170)
   - Add option to `dashboardCampaignFilter` dropdown (Dashboard, line ~69)
   - Add option to `groupCampaign` dropdown (Add/Edit modal, line ~267)
   - Add option to `qrCampaign` dropdown (QR Code page, line ~226)

2. **Styles** (`public/style.css`):
   - Add badge color class: `.campaign-badge.karnataka { background: #color; }`

3. **That's it!** The backend automatically handles:
   - New `/join/karnataka` route works immediately
   - Groups can be added with campaign="karnataka"
   - QR codes generate the correct URL
   - Analytics filter by campaign

### Example: Adding Karnataka Campaign

```html
<!-- In admin.html, add to ALL campaign dropdowns: -->
<option value="karnataka">Karnataka</option>
```

```css
/* In style.css: */
.campaign-badge.karnataka {
  background: #FF5722;
}
```

**URL will be**: `https://domain.com/join/karnataka`

---

## Production URLs (Railway)

| Item | URL |
|------|-----|
| Puducherry QR | `https://whatsapp-campaign-manager-production.up.railway.app/join` |
| Tamil Nadu QR | `https://whatsapp-campaign-manager-production.up.railway.app/join/tamilnadu` |
| Admin Panel | `https://whatsapp-campaign-manager-production.up.railway.app/admin.html` |
| Health Check | `https://whatsapp-campaign-manager-production.up.railway.app/health` |

**Admin Password**: Check Railway Dashboard → Variables → `ADMIN_PASSWORD`

---

## Railway Configuration

### Required Environment Variables
| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-set by Railway if linked |
| `ADMIN_PASSWORD` | Admin panel password | `SecureAdmin2024` |
| `SESSION_SECRET` | Session encryption key | Random string |
| `DOMAIN_URL` | Base URL for QR codes | `https://whatsapp-campaign-manager-production.up.railway.app` |
| `NODE_ENV` | Environment | `production` |
| `RATE_LIMIT_MINUTES` | Rate limit window | `1` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `10` |

### How DATABASE_URL Works
The app checks for `DATABASE_URL` environment variable:
- If present: Uses PostgreSQL
- If absent: Falls back to SQLite (local file `database.sqlite`)

**On Railway**: PostgreSQL is a separate service. The `DATABASE_URL` variable must be linked from the Postgres service to the app service. This is done in Railway Dashboard → App → Variables → Add Variable → Select from dropdown.

---

## CRITICAL WARNINGS

### 1. NEVER Change the `/join` URL
The `/join` route is used by Puducherry QR codes that are ALREADY PRINTED on marketing materials. Changing this breaks all existing QR codes.

### 2. NEVER Assume Database State
Before making changes, ALWAYS verify:
- What database is actually being used (check Railway logs for "Connected to PostgreSQL" or "Connected to SQLite")
- What data exists (check admin panel)
- Export data BEFORE any risky operations

### 3. Railway Auto-Deploys on Git Push
Every `git push` to main triggers automatic deployment. Changes go live immediately.

### 4. SQLite is for Local Development Only
The SQLite fallback exists ONLY for local development when DATABASE_URL is not set. On Railway, PostgreSQL should ALWAYS be used. SQLite data on Railway would be lost on every deploy because Railway containers are ephemeral.

---

## Mistakes Made & Lessons Learned

### 2026-01-10: Claude's Incorrect Database Diagnosis

**What Happened:**
- Claude (AI assistant) incorrectly diagnosed that SQLite was being used as fallback on Railway
- Claimed that DATABASE_URL was "not linked" to the Railway service
- Made changes in Railway Variables attempting to "fix" DATABASE_URL
- This may have disrupted the existing PostgreSQL connection
- Result: Puducherry group data was lost

**The Truth:**
- PostgreSQL was ALREADY properly configured and working
- SQLite fallback was NOT being used on production
- The data loss cause needs further investigation
- The assistant should have VERIFIED the actual state before making changes

**Lesson Learned:**
1. **NEVER assume** - Always verify the current state before diagnosing problems
2. **Check Railway logs** - They show which database is connected
3. **Export data first** - Before any database-related changes, export existing data
4. **Don't touch what's working** - If the system was working, investigate before changing configuration
5. **Ask before acting** - When unsure about critical infrastructure, ask the user

### How to Verify Database Connection
1. Check Railway logs after deploy - look for "Connected to PostgreSQL database" or "Connected to SQLite database"
2. Hit the `/health` endpoint - it shows database status
3. Check Railway Variables - `DATABASE_URL` should show `${{Postgres.DATABASE_URL}}` if linked

### 2026-01-10: PostgreSQL Placeholder Bug (ACTUAL BUG FOUND)

**Symptom:**
- `/join` (Puducherry) worked fine
- `/join/tamilnadu` gave 500 error "Something went wrong"

**Root Cause:**
The `run()` method in `database.js` was NOT converting `?` placeholders to PostgreSQL's `$1, $2, ...` format, while `get()` and `all()` methods DID convert them.

This caused INSERT/UPDATE queries (like `addScan()`, `incrementGroupCount()`) to fail with PostgreSQL syntax errors.

**The Bug (database.js line ~166):**
```javascript
// BEFORE - Missing placeholder conversion
async run(sql, params = []) {
  if (this.isPostgres) {
    const result = await this.db.query(sql, params);  // BUG: ? not converted!
    return { id: result.rows[0]?.id, changes: result.rowCount };
  }
  ...
}
```

**The Fix:**
```javascript
// AFTER - Added placeholder conversion
async run(sql, params = []) {
  if (this.isPostgres) {
    // Convert ? placeholders to $1, $2, etc.
    let pgSql = sql;
    let paramIndex = 1;
    while (pgSql.includes('?')) {
      pgSql = pgSql.replace('?', `$${paramIndex}`);
      paramIndex++;
    }
    const result = await this.db.query(pgSql, params);
    return { id: result.rows[0]?.id, changes: result.rowCount };
  }
  ...
}
```

**Why Puducherry Worked Initially:**
The error only triggered when `addScan()` was called AFTER finding a group. Initial testing may have had no groups, so the "Groups Full" page was shown (no addScan call = no error).

**Lesson Learned:**
- When adding PostgreSQL support to a SQLite-based app, ensure ALL database methods handle placeholder conversion consistently
- Test ALL code paths, not just the happy path

---

## Multi-Campaign Feature (Added 2026-01-10)

### What Was Added
- Campaign column in groups table (default: 'puducherry')
- `/join/:campaign` dynamic route
- Campaign filter in admin panel (Groups page)
- Campaign filter in dashboard
- Campaign selection in group modal
- Campaign-specific QR code generation

### Backward Compatibility
- `/join` route still works and defaults to 'puducherry'
- Existing Puducherry QR codes are NOT affected
- All existing groups were migrated to 'puducherry' campaign

---

## Local Development

```bash
# Install dependencies
npm install

# Create .env file with:
ADMIN_PASSWORD=test123
SESSION_SECRET=localsecret
DOMAIN_URL=http://localhost:3000
NODE_ENV=development
RATE_LIMIT_MINUTES=1
RATE_LIMIT_MAX_REQUESTS=100
# DATABASE_URL not set = uses SQLite locally

# Run
npm start
```

---

## Checklist Before Making Changes

- [ ] Read this entire file
- [ ] Check current database status (Railway logs or /health endpoint)
- [ ] Export current data via Admin Panel → Analytics → Export Data
- [ ] Understand what the user is asking for
- [ ] Verify if existing QR codes/URLs will be affected
- [ ] Test locally if possible
- [ ] Make changes incrementally
- [ ] Verify production after deploy

---

## Git Workflow

```bash
git add .
git commit -m "feat: description"
git push origin main
# Railway auto-deploys in ~1-2 minutes
```

---

## Contact & Credentials

See `CLAUDE.md` for hosting/GitHub credentials (Railway, Hostinger, etc.)

---

*Last Updated: 2026-01-10*
*Updated By: Claude AI (after making mistakes and learning from them)*
