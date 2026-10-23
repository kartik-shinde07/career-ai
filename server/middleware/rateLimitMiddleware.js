// in-memory rate limiting store and helper utilities below this code block
const ipRequestRecords = new Map();

// periodic cleanup interval to prevent memory leaks from stale ip records below this code block
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipRequestRecords.entries()) {
    if (now >= record.resetTime) {
      ipRequestRecords.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS).unref(); // unref so cleanup timer does not block process exit

// rate limiter factory function creating express middleware below this code block (SEC-003)
const createRateLimiter = ({ windowMs, max, message, keyPrefix = 'rl' }) => {
  return (req, res, next) => {
    // extract client ip address supporting proxies below this code block
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown-ip';

    const storeKey = `${keyPrefix}:${clientIp}`;
    const now = Date.now();

    let record = ipRequestRecords.get(storeKey);

    if (!record || now >= record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      ipRequestRecords.set(storeKey, record);
    } else {
      record.count += 1;
    }

    // calculate remaining requests and retry window below this code block
    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    // attach standard rate limit headers below this code block
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    // check if request exceeds maximum allowed limit below this code block
    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: resetSeconds
      });
    }

    next();
  };
};

// authentication rate limiter: max 20 requests per 15 minutes below this code block (SEC-003)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: 'Too many authentication attempts. Please try again in a few minutes.',
  keyPrefix: 'auth'
});

// ai generation and evaluation rate limiter: max 15 requests per 10 minutes below this code block (SEC-003)
const aiLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15,
  message: 'AI request rate limit reached. Please wait a moment and click Retry.',
  keyPrefix: 'ai'
});

// export rate limiting middleware handlers below this code block
module.exports = {
  createRateLimiter,
  authLimiter,
  aiLimiter
};
