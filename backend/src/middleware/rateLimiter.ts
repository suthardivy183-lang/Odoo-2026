import { NextFunction, Request, Response } from 'express';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 100;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const requestCounts = new Map<string, RateLimitEntry>();

const getClientIp = (req: Request): string => {
  return req.ip || req.socket.remoteAddress || 'unknown';
};

const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const now = Date.now();
  const ip = getClientIp(req);
  const entry = requestCounts.get(ip);

  if (!entry || entry.resetAt <= now) {
    requestCounts.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return next();
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);

    res.setHeader('Retry-After', retryAfterSeconds.toString());
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
    });
  }

  return next();
};

setInterval(() => {
  const now = Date.now();

  for (const [ip, entry] of requestCounts.entries()) {
    if (entry.resetAt <= now) {
      requestCounts.delete(ip);
    }
  }
}, WINDOW_MS).unref();

export default rateLimiter;
