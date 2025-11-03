# Google Calendar Integration Setup

## Step 1: Place Your Credentials JSON File

1. Create a `credentials` folder in the `ETraffic/backend` directory:
   ```
   ETraffic/backend/credentials/
   ```

2. Place your Google API credentials JSON file in this folder:
   ```
   ETraffic/backend/credentials/google-credentials.json
   ```

   **Important**: The JSON file should contain your service account credentials from Google Cloud Console.

## Step 2: Update Environment Variables

Add these variables to your `.env` file in `ETraffic/backend/`:

```env
# Google Calendar API Configuration
GOOGLE_CREDENTIALS_PATH=./credentials/google-credentials.json
GOOGLE_CALENDAR_ID=primary
```

Or if you want to use a specific calendar ID:
```env
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
```

## Step 3: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. Create a **Service Account**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Give it a name and click "Create and Continue"
   - Add role "Calendar API User" or "Viewer"
   - Click "Done"

5. Generate JSON Key:
   - Click on your service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Select "JSON" format
   - Download the JSON file
   - **Save this file as `google-credentials.json` in the credentials folder**

## Step 4: Share Calendar with Service Account

1. Open Google Calendar
2. Find the calendar you want to access (or create a new one)
3. Go to calendar settings > "Share with specific people"
4. Add your service account email (found in the JSON file under `client_email`)
5. Give it "See all event details" permission

## Step 5: Verify Installation

1. Install dependencies:
   ```bash
   cd ETraffic/backend
   npm install
   ```

2. Start the server:
   ```bash
   npm run dev
   ```

3. You should see one of these messages:
   - ✅ `Google Calendar API initialized successfully` (if credentials are valid)
   - ⚠️ `Google credentials file not found` (if file is missing - will use mock data)

## Testing the Integration

Once running, test the endpoint:
```bash
# Make sure you're authenticated first
GET http://localhost:5000/api/calendar/google-events?startDate=2024-01-01&endDate=2024-12-31
```

## Troubleshooting

### "File not found" Error
- Make sure the `credentials` folder exists in `ETraffic/backend/`
- Check the file name is exactly `google-credentials.json`
- Verify the path in `.env` matches your file location

### "Invalid credentials" Error
- Ensure the JSON file is valid JSON
- Check that the service account email has access to the calendar
- Verify the Google Calendar API is enabled in your project

### "Permission denied" Error
- Make sure you've shared the calendar with the service account email
- Verify the service account has the correct IAM roles

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `google-credentials.json` to version control
- Add `credentials/` to your `.gitignore` file
- Use environment variables for sensitive data in production

