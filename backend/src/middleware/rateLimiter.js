import rateLimit from 'express-rate-limit';

// General API rate limiter (100 requests per 15 mins)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

// Emergency SOS & Bed Hold Submission limiter (10 requests per 15 mins)
export const emergencySosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Emergency submission rate limit reached. Please wait before submitting another SOS.'
  }
});

// Authentication rate limiter (5 attempts per 15 mins)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Account temporarily locked for 15 minutes.'
  }
});
