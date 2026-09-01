import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import mongoose from 'mongoose';
import mongoSanitize from 'express-mongo-sanitize';
import cron from 'node-cron';
import { apiLimiter, emergencySosLimiter, authLimiter } from './middleware/rateLimiter.js';
import connectDB from './config/db.js';
import { initializeSocket } from './services/socket.js';
import { runLiveDataSimulation } from './scripts/simulateLiveData.js';
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

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// NoSQL Injection Prevention Middleware
app.use(mongoSanitize());

// Rate Limiting Middlewares
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);

// Health check & System Status
app.get(['/health', '/api/status'], (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const isDemo = global.isDemoMode || !isDbConnected;

  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'swasthya-setu-server',
    isDemoMode: isDemo,
    databaseConnected: isDbConnected,
    mode: isDemo ? 'degraded_demo' : 'live_production'
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

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

import { autoSeedData } from './scripts/autoSeed.js';

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    if (mongoose.connection.readyState === 1) {
      await autoSeedData();
    }
    
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

        // For each expired reservation, atomically restore the bed count
        for (const reservation of expiredReservations) {
          const bedField = `beds.${reservation.bedType}.available`;

          await Hospital.findByIdAndUpdate(
            reservation.hospitalId,
            { $inc: { [bedField]: 1 }, $set: { lastUpdated: now } }
          );

          await BedReservation.findByIdAndUpdate(reservation._id, { status: 'expired' });
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
