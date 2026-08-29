import { Server } from 'socket.io';

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

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-hospital', (hospitalId) => {
      socket.join(`hospital-${hospitalId}`);
      console.log(`Socket ${socket.id} joined hospital-${hospitalId}`);
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
    io.to(`hospital-${hospitalId}`).emit('hospital-bed-hold', {
      reservationCode: reservation.reservationCode,
      patientName: reservation.patientName,
      contactPhone: reservation.contactPhone,
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
