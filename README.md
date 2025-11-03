# ETraffic - Real-Time Traffic Monitoring & Incident Reporting Platform

ETraffic is a production-ready, Ethiopia-tailored traffic monitoring, incident reporting, and predictive analytics web platform. The system provides real-time traffic status, user-reported incidents, route alerts, and smart suggestions using Google Maps API.

## Features

- **Real-Time Traffic Map**: Color-coded roads (red/yellow/green) with automatic alternate route suggestions
- **Incident Reporting**: User-verified reports with GPS validation and text similarity checking
- **Reward Gamification**: Coin system that converts to Ethiopian Birr
- **AI-Powered Analytics**: Weekly summaries with charts and peak-hour visualizations
- **Ethiopian Calendar**: Holidays, events, and road closures (including Meskel Square)
- **Real-Time Alerts**: Geographically scoped notifications for nearby incidents
- **Multi-Language Support**: English (default) and Amharic
- **Admin Dashboard**: Report verification and user management

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MySQL 8.0+
- **Real-Time**: WebSockets (native implementation)
- **Maps**: SVG-based mock data visualization (no payment/API keys required)
- **Auth**: JWT with secure session management

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- **No external API keys required** - Uses mock data for maps and traffic

### Installation

1. **Clone and setup environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
- Database credentials
- JWT secret
- Realtime provider keys (optional - WebSocket works by default)

2. **Install dependencies:**

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Setup database:**

```bash
# Run migrations
cd backend
npm run migrate

# Seed sample data (including Meskel Square road closures)
npm run seed
```

4. **Start development servers:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

5. **Access the application:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Demo Accounts

The seed data includes the following test accounts:

### Verified User (Can Report Incidents)
- **Email**: `user@etraffic.test`
- **Password**: `password123`
- **National ID**: `1234567890`
- **Status**: Verified, 50 coins

### Admin User (Can Verify Reports)
- **Email**: `admin@etraffic.test`
- **Password**: `admin123`
- **National ID**: `9999999999`
- **Status**: Admin, Verified

### Unverified User (Cannot Report)
- **Email**: `unverified@etraffic.test`
- **Password**: `password123`
- **National ID**: `9876543210`
- **Status**: Unverified, 0 coins

## Demo: Meskel Square Road Closures

The system includes hard-coded sample data for Meskel Square road closures during Meskel celebrations:

1. Navigate to **Calendar** in the left sidebar
2. Find Meskel holiday (September 27 in Gregorian calendar, approximately Meskerem 17 in Ethiopian calendar)
3. Click on the date to view road closures
4. The map will show affected roads around Meskel Square:
   - Churchill Avenue
   - Ras Abebe Aregay Street
   - Hager Fikir Theater area

Alternate routes are automatically suggested when viewing the event day map.

## Project Structure

```
ETraffic/
├── backend/           # Express.js API server
│   ├── src/
│   │   ├── routes/    # API routes
│   │   ├── models/    # Database models
│   │   ├── middleware/# Auth, validation, etc.
│   │   ├── services/  # Business logic
│   │   ├── websocket/ # WebSocket server
│   │   └── utils/     # Utilities
│   ├── migrations/    # Database migrations
│   └── seeds/         # Seed data
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── app/       # Next.js app router pages
│   │   ├── components/# React components
│   │   ├── lib/       # Utilities, API clients
│   │   └── locales/   # i18n translations
├── shared/            # Shared TypeScript types
└── docs/              # Documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register with Ethiopian National ID
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Email verification
- `GET /api/auth/me` - Get current user

### Incidents
- `GET /api/incidents` - Get active incidents
- `POST /api/incidents` - Report incident (verified users only)
- `GET /api/incidents/:id` - Get incident details
- `PUT /api/incidents/:id/verify` - Verify incident (admin only)

### Analytics
- `GET /api/analytics/daily` - Daily travel analytics
- `GET /api/analytics/weekly-summary` - AI weekly summary
- `GET /api/analytics/peak-hours` - Peak hour traffic data

### Calendar & Events
- `GET /api/events` - Get events and road closures
- `GET /api/events/:date` - Get events for specific date

### Coins
- `GET /api/coins/balance` - Get user coin balance
- `POST /api/coins/convert` - Convert coins to Birr

### Alerts
- `GET /api/alerts` - Get nearby alerts
- WebSocket: Subscribe to location-based channels

## Environment Variables

See `.env.example` for all required variables. Key variables:

- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - JWT signing secret
- `NODE_ENV` - Environment (development/production)

**Note**: The app uses mock data for maps and traffic visualization - no external API keys required!

## Security Considerations

- **Ethiopian National ID**: Stored securely in database, marked as PII. Use encryption at rest in production.
- **GPS Validation**: Reports are validated against user's actual GPS location to prevent fake reports.
- **Text Similarity**: Reports are cross-checked for credibility using similarity algorithms.
- **Rate Limiting**: Report submissions are rate-limited to prevent abuse.
- **Audit Logging**: All sensitive actions (report creation, verification, bans) are logged.

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend E2E Tests (Stubs)

```bash
cd frontend
npm run test:e2e
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use production database credentials
3. Enable HTTPS
4. Configure reverse proxy (nginx)
5. Set up SSL certificates
6. Configure environment variables securely
7. Run database migrations: `npm run migrate`

## Architecture

The application follows a modular architecture:

- **Backend**: RESTful API with WebSocket support for real-time features
- **Frontend**: Server-side rendered Next.js with client-side interactivity
- **Real-Time**: WebSocket server with geographic channel subscriptions
- **Maps**: Google Maps API integration with traffic overlay and route calculations

## Contributing

This is a production-ready system designed for government or public deployment. Ensure all security best practices are followed, especially regarding:

- PII data (Ethiopian National ID)
- GPS location data
- Financial transactions (coin conversion)
- Admin actions (report verification, user bans)

## License

Proprietary - Built for Ethiopian Traffic Management Authority

## Support

For issues or questions, refer to `/docs/architecture.md` or contact the development team.

