import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from './websocket/server';
import authRoutes from './routes/auth';
import incidentRoutes from './routes/incidents';
import reportRoutes from './routes/reports';
import analyticsRoutes from './routes/analytics';
import eventRoutes from './routes/events';
import coinRoutes from './routes/coins';
import alertRoutes from './routes/alerts';
import adminRoutes from './routes/admin';
import locationRoutes from './routes/locations';
import calendarRoutes from './routes/calendar';
import { errorHandler } from './middleware/errorHandler';
import { auditLogger } from './middleware/auditLogger';
import path from 'path';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
const WS_PORT = parseInt(process.env.WEBSOCKET_PORT || '5001');

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Increase body size limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(auditLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/coins', coinRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/calendar', calendarRoutes);

// Error handler
app.use(errorHandler);

// Start HTTP server
httpServer.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});

// Start WebSocket server
const wsServer = new WebSocketServer(WS_PORT);
wsServer.start();

export default app;

