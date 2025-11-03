# ETraffic Architecture

## Overview

ETraffic is a full-stack real-time traffic monitoring platform built with:

- **Frontend**: Next.js 14 (React, TypeScript, Tailwind CSS)
- **Backend**: Node.js + Express.js (TypeScript)
- **Database**: MySQL 8.0+
- **Real-Time**: WebSocket Server (native)
- **Maps**: Google Maps API
- **Authentication**: JWT with secure sessions

## System Architecture

```
┌─────────────────┐
│   Next.js App   │
│  (Frontend)     │
└────────┬────────┘
         │
         │ HTTP/REST
         │ WebSocket
         │
┌────────▼────────┐
│  Express API    │
│  (Backend)      │
└────────┬────────┘
         │
         │ SQL
         │
┌────────▼────────┐
│   MySQL DB      │
└─────────────────┘
```

## Key Components

### Backend Services

1. **Authentication Service**
   - JWT token generation and validation
   - User registration with Ethiopian National ID
   - Email verification workflow
   - Role-based access control (admin, verified user, unverified user)

2. **Incident Reporting Service**
   - GPS location validation
   - Text similarity checking for credibility
   - Coin awarding system
   - Incident categorization (major_accident, heavy_congestion, road_construction)

3. **GPS Validation Service**
   - Haversine distance calculation
   - Location mismatch detection
   - Warning and ban logic for repeat offenders

4. **Text Similarity Service**
   - TF-IDF vectorization
   - Cosine similarity calculation
   - Credibility score boosting

5. **Coin Service**
   - Coin earning for reports
   - Balance tracking
   - Conversion to Ethiopian Birr (simulated)

6. **AI Service**
   - Weekly summary generation
   - Supports local fallback, OpenAI, or custom providers
   - Template-based summaries when AI unavailable

7. **WebSocket Server**
   - Real-time incident broadcasting
   - Geographic channel subscriptions
   - Location-based alert delivery

### Frontend Components

1. **Dashboard**
   - Real-time traffic map with Google Maps
   - Active incidents list
   - Incident summary sidebar

2. **Traffic Map**
   - Google Maps integration
   - Traffic layer overlay
   - Incident markers with severity colors
   - Automatic route suggestions

3. **Analytics View**
   - Weekly AI-generated summaries
   - Peak hour traffic charts
   - Incident frequency visualizations

4. **Calendar View**
   - Ethiopian holidays and events
   - Road closures visualization
   - Alternate route suggestions for event days

5. **Report Incident**
   - GPS-enabled form
   - Reporting guidelines
   - Coin balance display

6. **Alerts Center**
   - Nearby alerts (geographically scoped)
   - Real-time notifications
   - Read/unread status

## Database Schema

### Core Tables

- **users**: User accounts with National ID (PII)
- **incidents**: Reported incidents with GPS validation
- **coin_transactions**: Coin earning and conversion history
- **alerts**: User notifications
- **events**: Calendar events and holidays
- **road_closures**: Road closures linked to events
- **report_verifications**: Admin verification tracking
- **audit_logs**: Action audit trail
- **user_locations**: Analytics for frequent locations

## Security Considerations

1. **PII Data**: Ethiopian National ID stored securely, marked as sensitive
2. **GPS Validation**: Prevents fake reports through location matching
3. **Rate Limiting**: Prevents abuse of reporting endpoints
4. **Audit Logging**: All sensitive actions logged
5. **JWT Tokens**: Secure token-based authentication
6. **Input Validation**: Server-side validation for all inputs

## Real-Time Features

- WebSocket server broadcasts new incidents to nearby users
- Geographic scoping ensures users only receive relevant alerts
- Automatic incident updates every 30 seconds
- Location-based channel subscriptions

## Google Maps Integration

- Traffic layer overlay shows live traffic conditions
- Automatic alternate route suggestions when congestion detected
- Incident markers with severity-based colors
- Route calculation with multiple options

## Internationalization (i18n)

- Support for English (default) and Amharic
- Language toggle in sidebar
- Translation files in `/frontend/src/locales/`

## Testing

- Backend: Jest unit tests for auth and incidents
- Frontend: Playwright E2E test stubs
- Integration: API endpoint tests

## Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set up reverse proxy (nginx)
4. Enable HTTPS/SSL
5. Configure environment variables securely
6. Run database migrations

## Future Enhancements

- Payment gateway integration for coin conversion
- Advanced AI for text similarity (OpenAI)
- Firebase Realtime Database option
- Mobile app (React Native)
- Government API integration
- Advanced analytics with ML predictions

