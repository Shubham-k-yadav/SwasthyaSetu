import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env?.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
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
