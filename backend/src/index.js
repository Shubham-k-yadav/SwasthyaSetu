import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import mongoose from 'mongoose';
import mongoSanitize from 'express-mongo-sanitize';
import cron from 'node-cron';
import { apiLimiter, authLimiter, otpLimiter } from './middleware/rateLimiter.js';
import connectDB from './config/db.js';
import { initializeSocket } from './services/socket.js';
import BedReservation from './models/BedReservation.js';
import Hospital from './models/Hospital.js';

// Routes
import hospitalRoutes from './routes/hospitals.js';
import bloodRoutes from './routes/blood.js';
import donorRoutes from './routes/donors.js';
import emergencyRoutes from './routes/emergency.js';
import authRoutes from './routes/auth.js';
import translateRoutes from './routes/translate.js';
import systemRoutes from './routes/system.js';
import bloodBankRoutes from './routes/bloodbanks.js';
import ambulanceRoutes from './routes/ambulances.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Not allowed by CORS origin restriction'));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// NoSQL Injection Prevention Middleware
app.use(mongoSanitize());

// Rate Limiting Middlewares
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/hospitals/request-otp', otpLimiter);

// Health check & System Status
app.get(['/health', '/api/status'], (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.json({ 
    status: isDbConnected ? 'healthy' : 'degraded', 
    timestamp: new Date().toISOString(),
    service: 'swasthya-setu-server',
    databaseConnected: isDbConnected,
    mode: 'live_production'
  });
});

// API Routes
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/blood', bloodRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/bloodbanks', bloodBankRoutes);
app.use('/api/ambulances', ambulanceRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler - mask internal stack traces from clients
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({ error: err.message && process.env.NODE_ENV !== 'production' ? err.message : 'Internal server error' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Initialize Socket.io
    initializeSocket(httpServer);
    console.log('✔ Socket.io initialized');

    // ─── Auto-Expiry Cron Job (every 5 minutes) ─────────────────────────────
    // Finds all BedReservations that have passed their expiresAt time,
    // marks them 'expired', and restores the bed count in the Hospital document.
    cron.schedule('*/5 * * * *', async () => {
      if (mongoose.connection.readyState !== 1) return; // Only run in live mode
      try {
        const now = new Date();

        // Find all expired-but-still-active reservations
        const expiredReservations = await BedReservation.find({
          status: 'reserved',
          expiresAt: { $lte: now }
        }).lean();

        if (expiredReservations.length === 0) return;

        // For each expired reservation, atomically transition status first
        for (const reservation of expiredReservations) {
          // Atomically acquire and mark as expired to prevent duplicate processing by concurrent instances
          const updated = await BedReservation.findOneAndUpdate(
            { _id: reservation._id, status: 'reserved' },
            { $set: { status: 'expired' } },
            { new: true }
          );

          // Only restore bed count if THIS instance successfully transitioned the state
          if (updated) {
            const bedField = `beds.${reservation.bedType}.available`;
            await Hospital.findByIdAndUpdate(
              reservation.hospitalId,
              { $inc: { [bedField]: 1 }, $set: { lastUpdated: now } }
            );
          }
        }

        console.log(`[Cron] Auto-expired ${expiredReservations.length} reservation(s) & restored bed count(s)`);
      } catch (err) {
        console.error('[Cron] Auto-expiry error:', err.message);
      }
    });
    console.log('✔ Bed reservation auto-expiry cron scheduled (every 5 min)');

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`SwasthyaSetu Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
