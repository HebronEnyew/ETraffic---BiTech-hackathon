# Quick Setup: Google Calendar Integration

## 📋 Step-by-Step Instructions

### 1. Place Your JSON Credentials File

Place your Google API credentials JSON file here:
```
ETraffic/backend/credentials/google-credentials.json
```

**The file should contain service account credentials from Google Cloud Console.**

### 2. Update Your `.env` File

Add these lines to `ETraffic/backend/.env`:

```env
# Google Calendar API Configuration
GOOGLE_CREDENTIALS_PATH=./credentials/google-credentials.json
GOOGLE_CALENDAR_ID=primary
```

**Or if you have a specific calendar ID:**
```env
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
```

### 3. Verify the Setup

1. Start your backend server:
   ```bash
   cd ETraffic/backend
   npm run dev
   ```

2. Look for one of these messages in the console:
   - ✅ **Success**: `Google Calendar API initialized successfully`
   - ⚠️ **Warning**: `Google credentials file not found` (will use mock data)

### 4. Test the Integration

Once the server is running, the calendar widget will automatically fetch Google Calendar events!

## 📁 File Structure

Your backend should look like this:
```
ETraffic/backend/
├── credentials/
│   └── google-credentials.json  ← Place your JSON file here
├── src/
│   ├── services/
│   │   └── googleCalendar.ts    ← Handles Google Calendar API
│   └── routes/
│       └── calendar.ts          ← Calendar API endpoints
├── .env                         ← Add Google Calendar config here
└── package.json
```

## 🔍 What the Integration Does

1. **Reads your credentials** from `credentials/google-credentials.json`
2. **Authenticates** with Google Calendar API
3. **Fetches events** from your specified calendar
4. **Extracts road closures** from event descriptions and locations
5. **Combines** Google Calendar events with database events
6. **Displays** everything in the Ethiopian Calendar Widget

## ⚠️ Security Reminder

- ✅ The `credentials/` folder is in `.gitignore` (won't be committed)
- ❌ **Never commit your credentials JSON file to Git**
- 🔒 Keep your credentials file secure and private

## 🆘 Troubleshooting

**"File not found" error:**
- Make sure the file is named exactly `google-credentials.json`
- Check it's in `ETraffic/backend/credentials/` folder
- Verify the path in `.env` is correct

**"Invalid credentials" error:**
- Ensure the JSON file is valid JSON
- Check that you downloaded the correct service account key
- Verify the Google Calendar API is enabled in Google Cloud Console

**"Permission denied" error:**
- Make sure you've shared your calendar with the service account email
- The service account email is found in your JSON file under `"client_email"`

---

That's it! Once you place your JSON file and update `.env`, restart the server and you're good to go! 🚀

