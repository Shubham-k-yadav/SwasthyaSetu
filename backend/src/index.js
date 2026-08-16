import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import connectDB from './config/db.js';
import { initializeSocket } from './services/socket.js';

// Routes
import hospitalRoutes from './routes/hospitals.js';
import bloodRoutes from './routes/blood.js';
import donorRoutes from './routes/donors.js';
import emergencyRoutes from './routes/emergency.js';
import authRoutes from './routes/auth.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'swasthya-setu-server'
  });
});

// API Routes
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/blood', bloodRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Initialize Socket.io
    initializeSocket(httpServer);
    console.log('✔ Socket.io initialized');

    httpServer.listen(PORT, () => {
      console.log(`SwasthyaSetu Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
