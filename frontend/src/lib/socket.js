import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env?.VITE_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : '');

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('swasthya_setu_token') || localStorage.getItem('token') || localStorage.getItem('auth_token'))
      : null;

    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: token ? { token } : undefined,
    });

    socket.on('connect', () => {
      console.log('⚡ [SwasthyaSetu Socket] Connected to real-time server:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ [SwasthyaSetu Socket] Connection warning:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [SwasthyaSetu Socket] Disconnected:', reason);
    });
  }
  return socket;
};

export const connectSocket = (customToken) => {
  const s = getSocket();
  const token = customToken || (typeof window !== 'undefined' ? (localStorage.getItem('swasthya_setu_token') || localStorage.getItem('token')) : null);
  
  if (token && (!s.auth || s.auth.token !== token)) {
    s.auth = { token };
    if (s.connected) {
      s.disconnect().connect();
      return;
    }
  }

  if (!s.connected) {
    s.connect();
  }
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

// Event handlers
export const onBedUpdate = (callback) => {
  getSocket().on('bed-update', callback);
};

export const onBedHoldAlert = (callback) => {
  getSocket().on('hospital-bed-hold', callback);
};

export const onReservationStatusUpdated = (callback) => {
  getSocket().on('reservation-status-updated', callback);
};

export const onBloodUpdate = (callback) => {
  getSocket().on('blood-update', callback);
};

export const onEmergencyAlert = (callback) => {
  getSocket().on('emergency-alert', callback);
};

export const onDonorAlert = (callback) => {
  getSocket().on('donor-alert', callback);
};

export const onBlockchainVerification = (callback) => {
  getSocket().on('blockchain-verification', callback);
};

export const onRegistrationRequest = (callback) => {
  getSocket().on('new-registration-request', callback);
};

// Room management
export const joinHospitalRoom = (hospitalId) => {
  getSocket().emit('join-hospital', hospitalId);
};

export const leaveHospitalRoom = (hospitalId) => {
  getSocket().emit('leave-hospital', hospitalId);
};

export const joinCityRoom = (city) => {
  getSocket().emit('join-city', city);
};

export const leaveCityRoom = (city) => {
  getSocket().emit('leave-city', city);
};

export const joinBloodGroupRoom = (bloodGroup) => {
  getSocket().emit('join-blood-group', bloodGroup);
};

// Remove listeners
export const removeAllListeners = () => {
  getSocket().removeAllListeners();
};
