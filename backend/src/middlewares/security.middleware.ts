import { NextFunction, Request, Response } from 'express';

function sanitizeObject(obj: any): void {
  if (!obj || typeof obj !== 'object') return;
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (typeof value === 'string') {
      // Basic XSS sanitization: strip < and > and common event handlers
      obj[key] = value
        .replace(/[<>]/g, '')
        .replace(/on\w+=/gi, '')
        .replace(/javascript:/gi, '');
    } else if (typeof value === 'object') {
      sanitizeObject(value);
    }
  });
}

export function securityMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=()');

  // Basic input sanitization
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
}


