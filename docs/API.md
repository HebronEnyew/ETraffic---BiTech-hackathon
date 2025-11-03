# ETraffic API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /api/auth/register

Register a new user with Ethiopian National ID.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "ethiopianNationalId": "1234567890",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please verify your email.",
  "userId": 1
}
```

#### POST /api/auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "isVerified": true,
    "isAdmin": false,
    "coinsBalance": 50
  }
}
```

#### GET /api/auth/me

Get current authenticated user.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isVerified": true,
  "isAdmin": false,
  "coinsBalance": 50
}
```

### Incidents

#### GET /api/incidents

Get active incidents.

**Query Parameters:**
- `type` (optional): Filter by incident type
- `verified` (optional): Filter by verification status (true/false)
- `limit` (optional): Limit results (default: 50)

**Response:**
```json
[
  {
    "id": 1,
    "incidentType": "heavy_congestion",
    "latitude": 9.0249,
    "longitude": 38.7469,
    "locationDescription": "Bole Road near Kazanchis",
    "description": "Heavy traffic due to construction",
    "severity": "medium",
    "isVerified": true,
    "credibilityScore": 0.8,
    "similarReportsCount": 3,
    "coinsAwarded": 25,
    "status": "active",
    "createdAt": "2024-01-01T10:00:00Z"
  }
]
```

#### POST /api/incidents

Report a new incident (verified users only).

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "incidentType": "heavy_congestion",
  "latitude": 9.0249,
  "longitude": 38.7469,
  "reportedLatitude": 9.0249,
  "reportedLongitude": 38.7469,
  "locationDescription": "Bole Road near Kazanchis",
  "numberOfVehicles": 5,
  "description": "Heavy traffic due to construction work"
}
```

**Response:**
```json
{
  "id": 1,
  "message": "Incident reported successfully",
  "coinsAwarded": 10,
  "credibilityScore": 0.5,
  "similarReportsCount": 0
}
```

### Analytics

#### GET /api/analytics/daily

Get daily travel analytics for authenticated user.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "frequentLocations": [...],
  "incidentsByLocation": [...],
  "peakHours": {
    "8": 15,
    "9": 23,
    ...
  }
}
```

#### GET /api/analytics/weekly-summary

Get AI-generated weekly summary.

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "summary": "AI-generated paragraph...",
  "statistics": {
    "totalIncidents": 150,
    "verifiedIncidents": 120,
    "incidentTypes": {...},
    "peakHours": {...},
    "topLocations": [...]
  },
  "weekRange": {
    "start": "2024-01-01",
    "end": "2024-01-07"
  }
}
```

### Events & Calendar

#### GET /api/events

Get all events.

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
[
  {
    "id": 1,
    "eventType": "holiday",
    "nameEn": "Meskel",
    "nameAm": "መስቀል",
    "eventDate": "2024-09-27",
    "ethiopianDate": "Meskerem 17",
    "affectedArea": "Meskel Square",
    "affectedRoads": ["Churchill Avenue", "Ras Abebe Aregay Street"]
  }
]
```

#### GET /api/events/:date

Get events and road closures for specific date.

**Response:**
```json
{
  "events": [...],
  "roadClosures": [
    {
      "id": 1,
      "roadName": "Churchill Avenue near Meskel Square",
      "closureStart": "2024-09-27T06:00:00Z",
      "closureEnd": "2024-09-27T18:00:00Z",
      "alternateRouteDescription": "Use Ras Mekonnen Avenue"
    }
  ]
}
```

### Coins

#### GET /api/coins/balance

Get user coin balance.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "balance": 50
}
```

#### POST /api/coins/convert

Convert coins to Ethiopian Birr.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "coins": 100
}
```

**Response:**
```json
{
  "message": "Coins converted successfully",
  "birrAmount": 100,
  "newBalance": 0
}
```

### Alerts

#### GET /api/alerts

Get nearby alerts.

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `latitude` (required)
- `longitude` (required)
- `radius` (optional, default: 5000 meters)

**Response:**
```json
[
  {
    "id": 1,
    "alertType": "incident",
    "title": "Heavy Congestion",
    "message": "Heavy traffic reported nearby",
    "distance": 1200,
    "severity": "medium",
    "isRead": false,
    "createdAt": "2024-01-01T10:00:00Z"
  }
]
```

### Admin

#### PUT /api/admin/incidents/:id/verify

Verify or reject an incident (admin only).

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "verified": true,
  "notes": "Admin verified"
}
```

#### PUT /api/admin/users/:id/ban

Ban or unban a user (admin only).

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "banned": true,
  "reason": "Multiple GPS location mismatches"
}
```

## WebSocket Events

Connect to `ws://localhost:5001`

### Client → Server

```json
{
  "type": "authenticate",
  "userId": 1
}
```

```json
{
  "type": "update_location",
  "latitude": 9.0249,
  "longitude": 38.7469
}
```

### Server → Client

```json
{
  "type": "incident",
  "data": {
    "id": 1,
    "incidentType": "heavy_congestion",
    "latitude": 9.0249,
    "longitude": 38.7469,
    ...
  }
}
```

```json
{
  "type": "incidents_update",
  "data": [...]
}
```

```json
{
  "type": "alert",
  "data": {
    "id": 1,
    "title": "Heavy Congestion",
    "message": "...",
    ...
  }
}
```

