# ETraffic Demo Guide

## Quick Start Demo

This guide walks you through demonstrating ETraffic's key features using the seeded demo data.

## Demo Accounts

### Verified User (Can Report Incidents)
- **Email**: `user@etraffic.test`
- **Password**: `password123`
- **National ID**: `1234567890`
- **Status**: Verified, 50 coins
- **Can**: Report incidents, view analytics, convert coins

### Admin User (Can Verify Reports)
- **Email**: `admin@etraffic.test`
- **Password**: `admin123`
- **National ID**: `9999999999`
- **Status**: Admin, Verified
- **Can**: Verify incidents, ban users, access admin dashboard

### Unverified User (Cannot Report)
- **Email**: `unverified@etraffic.test`
- **Password**: `password123`
- **National ID**: `9876543210`
- **Status**: Unverified, 0 coins
- **Can**: View dashboard, browse incidents
- **Cannot**: Report incidents (redirected to login)

## Demo Scenarios

### 1. Meskel Square Road Closures

**Location**: Calendar section, September 27, 2024

1. Navigate to **Calendar** in the left sidebar
2. Find September 27, 2024 (marked with event indicator)
3. Click on the date to view Meskel event details
4. Observe:
   - Event name: "Meskel" (መስቀል)
   - Affected area: "Meskel Square, Churchill Avenue, Ras Abebe Aregay Street"
   - Road closures listed with alternate routes
5. Click to view map with road closures highlighted

**Expected Behavior:**
- Map shows affected roads around Meskel Square
- Alternate routes suggested automatically
- Road closures marked with red indicators
- Timeline shows closure from 6:00 AM to 6:00 PM

### 2. Report Incident Flow

**User**: `user@etraffic.test`

1. Login with verified user account
2. Navigate to **Report Incident** (via footer or direct URL)
3. Fill out the form:
   - Incident Type: "Heavy Congestion"
   - Location: "Bole Road near Kazanchis"
   - Description: "Heavy traffic due to construction work"
4. Enable GPS location (required)
5. Submit report

**Expected Behavior:**
- Report submitted successfully
- User earns 10 coins (or 25 if verified by admin)
- Coins displayed in user profile
- New incident appears on map in real-time
- Incident marker appears with appropriate color (red/yellow/green)

### 3. GPS Validation Warning

**Test GPS Mismatch:**

1. Login as verified user
2. Open browser DevTools → Network tab
3. Report incident with mismatched GPS coordinates
4. Submit report with location far from actual GPS

**Expected Behavior:**
- Warning message: "Reported location does not match GPS location"
- Warning count incremented
- After 3 warnings: Account banned
- Banned users cannot report incidents

### 4. Incident Verification (Admin)

**User**: `admin@etraffic.test`

1. Login as admin
2. View incidents on dashboard
3. Click "Verify" on an unverified incident
4. Add verification notes (optional)
5. Confirm verification

**Expected Behavior:**
- Incident marked as verified
- Reporter earns additional coins (25 total for verified report)
- Incident credibility score increased
- Incident shows "✓ Verified" badge on map

### 5. Real-Time Alerts

**User**: Any authenticated user

1. Enable location services in browser
2. Navigate to **Alerts** in sidebar
3. Observe nearby alerts based on current location

**Expected Behavior:**
- Only alerts within 5km radius shown
- Alerts update in real-time via WebSocket
- Distance from user displayed
- Mark as read functionality

### 6. Analytics Dashboard

**User**: Verified user

1. Navigate to **Analytics** in sidebar
2. View weekly AI-generated summary
3. Observe peak hour traffic comparison chart
4. Check incident frequency by type

**Expected Behavior:**
- Summary paragraph generated (AI or fallback)
- Charts show normal days vs event days
- Peak hours visualization (8 AM - 6 PM typically highest)
- User's frequent locations displayed

### 7. Coin Conversion

**User**: `user@etraffic.test` (has 50 coins)

1. Navigate to profile or coin section
2. View current balance: 50 coins
3. Attempt conversion (requires 100 coins minimum)
4. Submit another report to earn more coins
5. Once balance reaches 100+, convert coins

**Expected Behavior:**
- Minimum 100 coins required for conversion
- Conversion rate: 1 coin = 1 ETB (configurable)
- Transaction logged in history
- Balance updated after conversion
- Simulated payment (no real money transferred)

### 8. Text Similarity Checking

**Test Multiple Reports:**

1. Login with multiple verified users (or use same user multiple times)
2. Report similar incidents in same area:
   - Report 1: "Heavy traffic due to construction"
   - Report 2: "Heavy traffic from construction work"
   - Report 3: "Construction causing heavy traffic"
3. Submit all reports near each other (< 500m)

**Expected Behavior:**
- System detects similarity between reports
- Credibility score boosted for similar reports
- Similar reports count increased
- Higher credibility = higher trust in incident

### 9. Language Toggle (i18n)

1. Click language toggle in sidebar (English ↔ Amharic)
2. Observe UI text changes
3. Navigate through different sections
4. Check translations for:
   - Sidebar navigation
   - Dashboard titles
   - Incident types
   - Footer links

**Expected Behavior:**
- All UI text translated
- Amharic script displayed correctly
- Language preference persists during session
- Calendar events show both English and Amharic names

### 10. Calendar Event Click

1. Navigate to **Calendar**
2. Click on Meskel event date (September 27)
3. View event details and road closures
4. Click "View Map" to see road closures

**Expected Behavior:**
- Event details displayed
- Road closures listed
- Alternate routes shown
- Map view updates with closures
- Affected roads highlighted

## Sample Seeded Data

### Incidents
- Heavy congestion on Bole Road (verified)
- Major accident near Wollo Sefer (unverified)
- Road construction on Africa Avenue (verified)

### Events
- Meskel (September 27, 2024)
- Ethiopian New Year (September 11, 2024)
- Timket (January 19, 2025)

### Road Closures (Meskel)
- Churchill Avenue near Meskel Square
- Ras Abebe Aregay Street
- Meskel Square surrounding area

## Troubleshooting

### Map Not Loading
- Check Google Maps API key in `.env.local`
- Ensure API key has proper permissions (Maps JavaScript API, Directions API)
- Check browser console for errors

### WebSocket Connection Failed
- Ensure backend WebSocket server is running on port 5001
- Check firewall settings
- Verify WebSocket URL in frontend `.env.local`

### Database Connection Errors
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database `etraffic` exists
- Run migrations: `npm run migrate`
- Seed data: `npm run seed`

### GPS Location Not Working
- Enable location permissions in browser
- Use HTTPS (required for geolocation API)
- Check browser console for permission errors

## Next Steps

After running the demo:

1. **Add Google Maps API Key**: Get key from Google Cloud Console
2. **Configure Email**: Set up SMTP for email verification
3. **Enable AI Provider**: Add OpenAI API key for enhanced summaries
4. **Set Up Payment Gateway**: Integrate real payment processing for coin conversion
5. **Deploy to Production**: Follow production deployment guide

