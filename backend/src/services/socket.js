import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
      } catch (err) {
        // Allow unauthenticated connection for public broadcasts, but mark user as null
        socket.user = null;
      }
    } else {
      socket.user = null;
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-hospital', (hospitalId) => {
      // Authorization guard: Superadmin can join any hospital room.
      // Hospital admin can ONLY join their own hospital room.
      // Unauthenticated client cannot eavesdrop on private hospital rooms.
      if (!socket.user) {
        return socket.emit('error', { message: 'Authentication required to join hospital room' });
      }

      if (socket.user.role !== 'superadmin' && socket.user.hospitalId?.toString() !== hospitalId?.toString()) {
        return socket.emit('error', { message: 'Forbidden: Cannot join another hospital room' });
      }

      socket.join(`hospital-${hospitalId}`);
      console.log(`Socket ${socket.id} (user: ${socket.user.userId || socket.user.email}) joined hospital-${hospitalId}`);
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
    io.emit('bed-update', { hospitalId, beds, timestamp: new Date() });
    io.to(`hospital-${hospitalId}`).emit('hospital-bed-update', { beds, timestamp: new Date() });
  }
};

export const emitBedHoldAlert = (hospitalId, reservation, hospitalName) => {
  if (io) {
    // Mask phone number for privacy: e.g. 98765*****
    const rawPhone = reservation.contactPhone || '';
    const maskedPhone = rawPhone.length === 10
      ? `${rawPhone.slice(0, 5)}*****`
      : '**********';

    io.to(`hospital-${hospitalId}`).emit('hospital-bed-hold', {
      reservationCode: reservation.reservationCode,
      patientName: reservation.patientName,
      contactPhone: maskedPhone,
      bedType: reservation.bedType,
      hospitalName,
      createdAt: reservation.createdAt || new Date(),
      expiresAt: reservation.expiresAt
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

