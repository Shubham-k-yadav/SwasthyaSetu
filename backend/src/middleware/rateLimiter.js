import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

// General API rate limiter (5000 requests per 15 mins, exempt on localhost during development)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDev || req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1',
  message: {
    error: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

// Emergency SOS & Bed Hold Submission limiter
export const emergencySosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDev,
  message: {
    error: 'Emergency submission rate limit reached. Please wait before submitting another SOS.'
  }
});

// Authentication rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDev,
  message: {
    error: 'Too many login attempts. Account temporarily locked for 15 minutes.'
  }
});

// Ambulance Location Update limiter (Max 1 request per 2 seconds in prod, exempt in dev)
export const ambulanceLocationLimiter = rateLimit({
  windowMs: 2 * 1000, // 2 seconds
  max: isDev ? 100 : 1,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDev,
  message: {
    error: 'Location update rate limit exceeded. Updates allowed once every 2 seconds.'
  }
});
