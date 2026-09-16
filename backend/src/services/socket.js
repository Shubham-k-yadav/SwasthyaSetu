import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

let io;

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // In development or local network, allow any origin (e.g. mobile phones on 192.168.x.x, localhost, 127.0.0.1)
        if (!origin || process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        const allowed = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim());
        if (allowed.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error('Origin not allowed by Socket.io CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // If hospitalId is missing in JWT payload, resolve from User DB
        if (!decoded.hospitalId && decoded.userId && mongoose.Types.ObjectId.isValid(decoded.userId)) {
          const userDoc = await User.findById(decoded.userId).select('hospitalId role email').lean();
          if (userDoc) {
            decoded.hospitalId = userDoc.hospitalId ? String(userDoc.hospitalId) : undefined;
            decoded.role = decoded.role || userDoc.role;
          }
        }
        socket.user = decoded;
        console.log(`[Socket] Authenticated client ${socket.id}: ${decoded.email || decoded.userId} (role: ${decoded.role}, hospitalId: ${decoded.hospitalId})`);
      } catch (err) {
        socket.user = null;
      }
    } else {
      socket.user = null;
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Auto-join rooms based on authenticated role/hospital
    if (socket.user?.role === 'superadmin') {
      socket.join('superadmin-room');
      console.log(`Socket ${socket.id} (Superadmin) auto-joined superadmin-room`);
    }
    if (socket.user?.hospitalId) {
      const userHospId = String(socket.user.hospitalId);
      socket.join(`hospital-${userHospId}`);
      console.log(`Socket ${socket.id} (Hospital Admin) auto-joined hospital-${userHospId}`);
    }

    socket.on('join-hospital', (hospitalId) => {
      const cleanHospId = String(hospitalId?._id || hospitalId || '').trim();
      if (!cleanHospId) return;

      socket.join(`hospital-${cleanHospId}`);
      console.log(`Socket ${socket.id} joined hospital-${cleanHospId}`);
      socket.emit('joined-hospital-room', { hospitalId: cleanHospId });
    });

    socket.on('join-city', (city) => {
      socket.join(`city-${city.toLowerCase()}`);
      console.log(`Socket ${socket.id} joined city-${city}`);
    });

    socket.on('join-blood-group', (bloodGroup) => {
      socket.join(`blood-${bloodGroup}`);
      console.log(`Socket ${socket.id} joined blood-${bloodGroup}`);
    });

    socket.on('leave-hospital', (hospitalId) => {
      socket.leave(`hospital-${hospitalId}`);
    });

    socket.on('leave-city', (city) => {
      socket.leave(`city-${city.toLowerCase()}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const emitBedUpdate = (hospitalId, beds) => {
  if (io) {
    const cleanId = String(hospitalId?._id || hospitalId);
    console.log(`[Socket] Broadcasting bed-update for hospital: ${cleanId}`);
    io.emit('bed-update', { hospitalId: cleanId, beds, timestamp: new Date() });
    io.to(`hospital-${cleanId}`).emit('hospital-bed-update', { beds, timestamp: new Date() });
  }
};

export const emitBedHoldAlert = (hospitalId, reservation, hospitalName) => {
  if (io) {
    const cleanId = String(hospitalId?._id || hospitalId);
    // Mask phone number for privacy: e.g. 98765*****
    const rawPhone = reservation.contactPhone || '';
    const maskedPhone = rawPhone.length === 10
      ? `${rawPhone.slice(0, 5)}*****`
      : '**********';

    const alertPayload = {
      hospitalId: cleanId,
      reservationId: reservation._id,
      reservationCode: reservation.reservationCode,
      patientName: reservation.patientName,
      contactPhone: maskedPhone,
      bedType: reservation.bedType,
      hospitalName,
      status: reservation.status || 'reserved',
      createdAt: reservation.createdAt || new Date(),
      expiresAt: reservation.expiresAt
    };

    console.log(`🚨 [Socket] Broadcasting bed-hold alert for hospital: ${cleanId}, patient: ${reservation.patientName}`);
    // Broadcast single authoritative event to all connected clients
    io.emit('hospital-bed-hold', alertPayload);
  }
};

export const emitBedHoldStatusChange = (reservationCode, data = {}) => {
  if (io) {
    const cleanCode = String(reservationCode || '').trim();
    console.log(`[Socket] Broadcasting reservation-status-updated for code ${cleanCode}: status=${data.status}`);
    io.emit('reservation-status-updated', {
      reservationCode: cleanCode,
      status: data.status,
      hospitalId: String(data.hospitalId?._id || data.hospitalId || ''),
      message: data.message || `Reservation ${cleanCode} is now ${data.status}`,
      timestamp: new Date()
    });
  }
};

export const emitBloodUpdate = (hospitalId, bloodStock) => {
  if (io) {
    io.emit('blood-update', { hospitalId, bloodStock, timestamp: new Date() });
    io.to(`hospital-${hospitalId}`).emit('hospital-blood-update', { bloodStock, timestamp: new Date() });
  }
};

export const emitEmergencyAlert = (city, emergency) => {
  if (io) {
    io.to(`city-${city.toLowerCase()}`).emit('emergency-alert', { 
      emergency, 
      timestamp: new Date() 
    });
  }
};

export const emitDonorAlert = (bloodGroup, request) => {
  if (io) {
    io.to(`blood-${bloodGroup}`).emit('donor-alert', { 
      request, 
      timestamp: new Date() 
    });
  }
};

export const emitBlockchainVerification = (hospitalId, verification) => {
  if (io) {
    io.emit('blockchain-verification', { hospitalId, verification, timestamp: new Date() });
  }
};

export const emitRegistrationRequest = (type, data) => {
  if (io) {
    io.emit('new-registration-request', {
      type, // 'hospital' | 'bloodbank' | 'ambulance'
      name: data.name || data.vehicleNumber,
      city: data.city || 'India',
      timestamp: new Date().toISOString()
    });
  }
};

export const emitBedUpgradeRequest = (request) => {
  if (io) {
    io.emit('new-bed-upgrade-request', {
      requestId: request._id,
      hospitalName: request.hospitalName,
      timestamp: new Date().toISOString()
    });
  }
};

