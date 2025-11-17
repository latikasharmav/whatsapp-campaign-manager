# Mobile Testing Guide - WhatsApp Campaign Manager

## How to Test with Your Mobile Phone

Your server is running and ready to test! Here's how to scan QR codes from your mobile and get added to WhatsApp groups.

## Current Setup

**Your Computer's IP**: `192.168.1.2`
**Server Port**: `3000`
**Domain URL Updated**: ✅ (Changed to http://192.168.1.2:3000)

## Prerequisites

✅ Your computer and mobile phone must be on the **SAME WiFi network**
✅ Server must be running (it is!)
✅ Windows Firewall must allow connections on port 3000

---

## Step 1: Allow Firewall Access (Important!)

Windows Firewall may block incoming connections. You need to allow Node.js:

### Option A: Quick Test (Disable Firewall Temporarily)
⚠️ **Not recommended for production, only for testing**

1. Open Windows Security
2. Go to "Firewall & network protection"
3. Click on your active network (Private network)
4. Turn off "Windows Defender Firewall" temporarily
5. Test your app
6. **Turn it back ON after testing**

### Option B: Add Firewall Rule (Recommended)
1. Press `Win + R`, type `wf.msc`, press Enter
2. Click "Inbound Rules" → "New Rule"
3. Select "Port" → Click Next
4. Select "TCP", enter port `3000` → Next
5. Select "Allow the connection" → Next
6. Check all profiles → Next
7. Name it "WhatsApp Campaign Manager" → Finish

---

## Step 2: Access from Mobile Browser (Test First)

Before generating QR codes, test if your mobile can access the server:

**On your mobile browser, visit:**
```
http://192.168.1.2:3000/admin.html
```

### Expected Results:
- ✅ Admin login page appears → **Working!**
- ❌ "Can't reach this page" → **Firewall issue or not on same WiFi**

---

## Step 3: Add a Real WhatsApp Group

1. **On your computer**, go to: http://localhost:3000/admin.html
2. Login with password: `SecureAdmin2024`
3. Click "Groups" in navigation
4. Click "Add Group" button

### Get WhatsApp Group Link:
1. Open WhatsApp on your phone
2. Go to the group you want to use
3. Tap group name → "Invite via link"
4. Copy the link (looks like: `https://chat.whatsapp.com/ABC123XYZ`)

### Add to Dashboard:
- **Name**: "My Test Group" (or any name you want)
- **WhatsApp Link**: Paste the link you copied
- **Capacity**: 256 (or your desired limit, max 1024)
- Check "Active"
- Click "Save Group"

---

## Step 4: Generate QR Code with Network IP

1. Click "QR Code" in navigation
2. Select size (Medium or Large)
3. Click "Generate QR Code"
4. You'll see a QR code pointing to: `http://192.168.1.2:3000/join`
5. Click "Download QR Code" to save it

---

## Step 5: Test QR Code Scan from Mobile

### Method 1: Scan Downloaded QR Code

1. Download the QR code image to your phone (email it, or airdrop, etc.)
2. Open WhatsApp on your phone
3. Tap the three dots (menu) → "Settings"
4. Tap "QR code" icon
5. Tap "Scan code"
6. Scan the QR code you downloaded

**Expected:** Should redirect to your WhatsApp group!

### Method 2: Scan from Computer Screen

1. Display the QR code on your computer screen
2. Open your phone's camera app
3. Point at the QR code
4. Tap the notification/link that appears
5. Should redirect to WhatsApp group

### Method 3: Use QR Code Scanner App

1. Download any QR scanner app
2. Scan the QR code
3. Tap the URL that appears
4. Should redirect to WhatsApp group

---

## Step 6: Verify It Worked

After scanning, check:

1. **On Mobile**: Were you redirected to WhatsApp group?
2. **On Dashboard**:
   - Go to Dashboard page
   - Check "Recent Scans" table
   - You should see your scan appear!
3. **On Groups Page**:
   - The group's "Current Count" should increase by 1
   - Progress bar should update

---

## Testing Different Scenarios

### Scenario 1: Test with Multiple Groups

1. Add 3-4 groups in the dashboard
2. Set different capacities (e.g., 10, 20, 30)
3. Scan the QR code multiple times
4. Watch as it distributes to different groups

### Scenario 2: Test When Group is Full

1. Set a group capacity to 1
2. Scan QR code once (gets added)
3. Scan again (should go to next available group)
4. Check dashboard to confirm

### Scenario 3: Test When All Groups are Full

1. Set all groups to inactive or full
2. Scan QR code
3. Should see "All Groups Are Full" message

---

## Troubleshooting

### Mobile Can't Access Server

**Problem**: Browser shows "Can't reach this page"

**Solutions**:
1. ✅ Both devices on same WiFi? Check WiFi name on both
2. ✅ Firewall rule added? See Step 1
3. ✅ IP address correct? Run `ipconfig` again to verify
4. ✅ Server running? Check terminal

### QR Code Scans But Nothing Happens

**Problem**: QR code scans but doesn't redirect

**Solutions**:
1. ✅ Added a real WhatsApp group link?
2. ✅ Group is marked as "Active"?
3. ✅ Group has available capacity?
4. ✅ Check browser console for errors

### "Invalid Invite Link" in WhatsApp

**Problem**: WhatsApp says invite link is invalid

**Solutions**:
1. ✅ WhatsApp link correct format? Must be `https://chat.whatsapp.com/...`
2. ✅ Link still valid? Group admin didn't reset it?
3. ✅ Try generating new link from WhatsApp group

### Rate Limit Error

**Problem**: "Too many requests" message

**Solution**: Wait 1 minute or increase limit in `.env`:
```env
RATE_LIMIT_MAX_REQUESTS=10
```

---

## URLs Reference

### From Computer (localhost):
- Admin Panel: http://localhost:3000/admin.html
- Join URL: http://localhost:3000/join
- Health: http://localhost:3000/health

### From Mobile (network IP):
- Admin Panel: http://192.168.1.2:3000/admin.html
- Join URL: http://192.168.1.2:3000/join
- Health: http://192.168.1.2:3000/health

### QR Code Should Point To:
```
http://192.168.1.2:3000/join
```

---

## Advanced: Make It Work from Anywhere (Not Just Same WiFi)

To test from different WiFi or mobile data, you need to expose your local server to the internet:

### Option 1: ngrok (Easiest)

1. Download ngrok: https://ngrok.com/download
2. Run: `ngrok http 3000`
3. You'll get a URL like: `https://abc123.ngrok.io`
4. Update `.env`: `DOMAIN_URL=https://abc123.ngrok.io`
5. Restart server
6. Generate new QR code
7. Now it works from anywhere!

### Option 2: Deploy to Cloud

Deploy to Railway, Heroku, or any cloud platform (see README.md for deployment guide)

---

## Complete Test Flow

Here's the complete flow to test everything:

```
1. ✅ Server running on computer
2. ✅ Firewall allows port 3000
3. ✅ Mobile on same WiFi
4. ✅ Test mobile access: http://192.168.1.2:3000/admin.html
5. ✅ Add real WhatsApp group in dashboard
6. ✅ Generate QR code
7. ✅ Scan QR code from mobile
8. ✅ Get redirected to WhatsApp
9. ✅ Check dashboard - scan logged
10. ✅ Check groups - count increased
```

---

## Example Test Session

**What I did:**
1. Added group "Test Campaign Mumbai"
2. Used WhatsApp link from my test group
3. Set capacity to 100
4. Generated medium QR code
5. Scanned with phone camera
6. Redirected to WhatsApp ✅
7. Checked dashboard - new scan appears ✅
8. Group count: 0 → 1 ✅

**SUCCESS!** 🎉

---

## Security Note

When testing on local network:
- Your server is accessible to anyone on your WiFi
- For production, deploy to a proper hosting service
- Use HTTPS in production
- Change admin password before deployment

---

## Next Steps After Testing

Once testing is successful:

1. **For Local Events**:
   - Print QR codes (use Large size)
   - Display at event venues
   - Monitor dashboard in real-time

2. **For Online Campaigns**:
   - Deploy to cloud (Railway, Heroku, etc.)
   - Use custom domain
   - Share QR code on social media

3. **For Production**:
   - Change admin password
   - Set up HTTPS
   - Configure monitoring
   - Set up backups

---

## Quick Reference Card

```
╔════════════════════════════════════════════════════╗
║         MOBILE TESTING QUICK REFERENCE             ║
╠════════════════════════════════════════════════════╣
║ Computer IP:    192.168.1.2                        ║
║ Port:           3000                               ║
║ Mobile URL:     http://192.168.1.2:3000/join      ║
║ Admin:          http://192.168.1.2:3000/admin.html ║
║ Password:       SecureAdmin2024                    ║
║                                                    ║
║ Requirements:                                      ║
║ • Same WiFi network                                ║
║ • Firewall allows port 3000                        ║
║ • Real WhatsApp group added                        ║
╚════════════════════════════════════════════════════╝
```

---

**Happy Testing!** 📱✨

If you encounter any issues, check the troubleshooting section or refer to README.md for more details.
