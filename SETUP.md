# ETraffic Setup Guide

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] MySQL 8.0+ installed and running
- [ ] MySQL user with create database privileges

## Step-by-Step Setup

### 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE etraffic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user (optional, can use root)
CREATE USER 'etraffic_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON etraffic.* TO 'etraffic_user'@'localhost';
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

### 2. Backend Setup

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
# Set:
# - DATABASE_HOST=localhost
# - DATABASE_PORT=3306
# - DATABASE_NAME=etraffic
# - DATABASE_USER=etraffic_user (or root)
# - DATABASE_PASSWORD=your_password
# - JWT_SECRET=your_random_secret_key

# Install dependencies
npm install

# Run migrations
npm run migrate

# Seed database
npm run seed

# Start backend server
npm run dev
```

Backend should now be running on `http://localhost:5000`
WebSocket server on `ws://localhost:5001`

### 3. Frontend Setup

```bash
cd frontend

# Copy environment template
cp .env.example .env.local

# Edit .env.local with:
# - NEXT_PUBLIC_API_URL=http://localhost:5000
# - NEXT_PUBLIC_WS_URL=ws://localhost:5001

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend should now be running on `http://localhost:3000`

### 4. Verify Installation

1. Open `http://localhost:3000` in browser
2. You should see the ETraffic dashboard
3. Login with demo account:
   - Email: `user@etraffic.test`
   - Password: `password123`

## Map & Traffic Visualization

**Note**: ETraffic uses mock data for maps and traffic visualization - no external API keys or payment required!

- **Traffic Map**: SVG-based map with mock roads showing traffic colors (red/yellow/green)
- **Traffic Colors**: 
  - Red = High congestion
  - Yellow = Medium congestion  
  - Green = Low congestion
- **Alternate Routes**: Suggested based on incident data and mock road congestion
- **Incident Markers**: Displayed on map with severity-based colors

The app works completely offline with simulated traffic data for Addis Ababa roads.

## Troubleshooting

### Database Connection Failed

- Check MySQL is running: `mysql -u root -p`
- Verify database exists: `SHOW DATABASES;`
- Check credentials in `.env`
- Ensure user has privileges: `SHOW GRANTS FOR 'etraffic_user'@'localhost';`

### Migration Errors

- Ensure database exists
- Check MySQL version: `SELECT VERSION();` (need 8.0+)
- Verify SQL syntax compatibility

### Frontend Build Errors

- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build`

### Map Not Displaying

- Check browser console for errors
- Verify SVG rendering is supported in your browser
- Clear browser cache and reload

### WebSocket Connection Failed

- Ensure backend WebSocket server is running
- Check port 5001 is not in use
- Verify WebSocket URL in `.env.local`
- Check firewall settings

## Next Steps

After successful setup:

1. **Explore Demo Data**: See `docs/DEMO.md`
2. **View Meskel Road Closures**: Calendar → September 27, 2024
3. **Test Report Flow**: Login as `user@etraffic.test` and report incident
4. **Test Admin Functions**: Login as `admin@etraffic.test`
5. **Enable Real Features**: Add Google Maps API key, configure email, etc.

## Production Deployment

See `docs/architecture.md` for production deployment guidelines.

## Support

- Check `README.md` for overview
- See `docs/API.md` for API documentation
- Review `docs/architecture.md` for system design
- Check `docs/DEMO.md` for demo scenarios

