import rateLimit from 'express-rate-limit';

export const reportRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests, please try again later.',
});

export const authRateLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes (configurable)
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20'), // 20 attempts (configurable, increased from 5)
  message: 'Too many authentication attempts. Please wait a few minutes before trying again.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

