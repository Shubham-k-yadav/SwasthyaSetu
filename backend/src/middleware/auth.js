import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { mockUsers } from '../utils/mockStore.js';
import mongoose from 'mongoose';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_swasthya_setu_2026';

    const decoded = jwt.verify(token, secret);

    let user = null;
    if (mongoose.connection.readyState === 1 && !global.isDemoMode && mongoose.Types.ObjectId.isValid(decoded.userId)) {
      user = await User.findById(decoded.userId);
    }

    if (!user) {
      const mockUser = mockUsers.find(u => u._id === decoded.userId || u.id === decoded.userId || u.email === decoded.email);
      if (mockUser) {
        req.user = mockUser;
        return next();
      }
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
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_swasthya_setu_2026';
  const userId = typeof userOrId === 'object' ? userOrId._id : userOrId;
  const email = typeof userOrId === 'object' ? userOrId.email : undefined;
  const role = typeof userOrId === 'object' ? userOrId.role : undefined;
  return jwt.sign(
    { 
      userId, 
      email, 
      role 
    },
    secret,
    { expiresIn: '24h' }
  );
};
