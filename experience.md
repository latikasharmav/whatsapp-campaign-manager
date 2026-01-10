# WhatsApp Campaign Manager - Experience Log

## 2026-01-10: Multi-Campaign Support Added

### What was done
Added multi-campaign support to allow managing multiple campaigns (Puducherry, Tamil Nadu, etc.) from a single system without affecting existing QR codes.

### Key Changes

1. **Database Schema** (`database.js`)
   - Added `campaign` column to `groups` table with default value 'puducherry'
   - Added migration to add column to existing databases
   - Updated queries: `getActiveGroups(campaign)`, `getAllGroups(campaign)`, `addGroup()`, `updateGroup()`, `getCampaigns()`

2. **Server Routes** (`server.js`)
   - Created shared `handleJoin(req, res, campaign)` function
   - `/join` - backward compatible, defaults to 'puducherry'
   - `/join/:campaign` - new route for other campaigns (e.g., `/join/tamilnadu`)
   - Updated admin endpoints to support campaign filtering
   - Updated QR code generation to accept campaign parameter

3. **Admin Panel** (`public/admin.html`, `public/script.js`)
   - Added campaign filter dropdown in Groups page
   - Added campaign selection in group creation/edit modal
   - Added campaign selection in QR code generator
   - Campaign badges shown on group cards

4. **Styles** (`public/style.css`)
   - Added campaign badge styles (different colors for different campaigns)
   - Added header controls styling
   - Added QR campaign label styling

### Important URLs
- Puducherry (existing): `https://domain.com/join` (unchanged)
- Tamil Nadu (new): `https://domain.com/join/tamilnadu`

### Backward Compatibility
- Existing Puducherry QR codes continue to work
- All existing groups automatically assigned to 'puducherry' campaign
- No changes needed to printed marketing materials

### Adding New Campaigns
To add a new campaign:
1. Add option to dropdowns in `admin.html` (campaignFilter, groupCampaign, qrCampaign)
2. Add CSS class for the campaign badge color in `style.css`
3. That's it! The system will handle the rest automatically.

### Lessons Learned
- Always run column migrations BEFORE creating indexes on those columns
- Use default values for new columns to handle existing data gracefully
- Keep backward compatibility by preserving existing URL endpoints

## 2026-01-10: DATABASE_URL Fix on Railway

### Problem
After deploying multi-campaign changes, the `/join/tamilnadu` route showed "Groups Full" even though groups existed before. Investigation revealed:
- PostgreSQL service existed on Railway but **DATABASE_URL was NOT linked** to the app service
- App fell back to SQLite, which gets **wiped on every Railway deploy**
- All previous data was lost

### Fix
1. Navigated to Railway → whatsapp-campaign-manager → Variables
2. Clicked "Add Variable" and selected `DATABASE_URL` from Postgres service
3. Value was automatically set to `${{Postgres.DATABASE_URL}}`
4. Clicked Deploy to redeploy with the new variable

### Result
- App now connects to PostgreSQL (persistent storage)
- Data is preserved across deploys
- Groups need to be re-added (previous SQLite data is gone)

### Important Lesson
**ALWAYS verify DATABASE_URL is linked** when deploying to Railway with PostgreSQL. Without it:
- App silently falls back to SQLite
- Data is lost on each deploy
- No obvious error message indicates the problem

### Current URLs
- Puducherry: `https://whatsapp-campaign-manager-production.up.railway.app/join`
- Tamil Nadu: `https://whatsapp-campaign-manager-production.up.railway.app/join/tamilnadu`
- Admin Panel: `https://whatsapp-campaign-manager-production.up.railway.app/admin.html`
- Admin Password: Check Railway Variables → ADMIN_PASSWORD
