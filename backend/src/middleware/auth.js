import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import mongoose from 'mongoose';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('FATAL: JWT_SECRET environment variable is not defined.');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    const decoded = jwt.verify(token, secret);

    if (decoded.role === 'patient_hold') {
      req.user = {
        role: 'patient_hold',
        reservationCode: decoded.reservationCode,
        hospitalId: decoded.hospitalId
      };
      return next();
    }

    const user = (decoded.userId && mongoose.Types.ObjectId.isValid(decoded.userId))
      ? await User.findById(decoded.userId)
      : null;

    if (!user) {
      res.status(401).json({ error: 'Invalid token or user inactive' });
      return;
    }

    if (!user.isActive && user.role !== 'superadmin') {
      res.status(401).json({ error: 'Account pending activation or verification' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authenticateOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      req.user = null;
      return next();
    }
    const decoded = jwt.verify(token, secret);
    if (decoded.role === 'patient_hold') {
      req.user = {
        role: 'patient_hold',
        reservationCode: decoded.reservationCode,
        hospitalId: decoded.hospitalId
      };
      return next();
    }
    const user = (decoded.userId && mongoose.Types.ObjectId.isValid(decoded.userId))
      ? await User.findById(decoded.userId)
      : null;
    if (user && (user.isActive || user.role === 'superadmin')) {
      req.user = user;
    } else {
      req.user = null;
    }
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
      return;
    }

    next();
  };
};

export const generateToken = (userOrId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
  }
  const userId = typeof userOrId === 'object' ? userOrId._id : userOrId;
  const email = typeof userOrId === 'object' ? userOrId.email : undefined;
  const role = typeof userOrId === 'object' ? userOrId.role : undefined;
  const hospitalId = typeof userOrId === 'object' ? (userOrId.hospitalId || userOrId.hospital?._id || userOrId.hospital) : undefined;
  return jwt.sign(
    { 
      userId, 
      email, 
      role,
      hospitalId: hospitalId ? String(hospitalId) : undefined
    },
    secret,
    { expiresIn: '24h' }
  );
};
