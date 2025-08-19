import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AdvancedRateLimitMiddleware implements NestMiddleware {
  private readonly limits = {
    auth: { limit: 5, ttl: 60 }, // 5 requests per minute for auth
    api: { limit: 100, ttl: 60 }, // 100 requests per minute for API
    default: { limit: 20, ttl: 60 } // 20 requests per minute default
  };

  private requestCounts = new Map<string, { count: number; resetTime: number }>();

  use(req: Request, res: Response, next: NextFunction) {
    const clientIp = req.ip || req.connection.remoteAddress;
    const path = req.path;
    
    // Determine rate limit based on path
    let limit = this.limits.default;
    if (path.startsWith('/auth')) {
      limit = this.limits.auth;
    } else if (path.startsWith('/api') || path.startsWith('/evaluation') || path.startsWith('/patient')) {
      limit = this.limits.api;
    }

    const key = `${clientIp}:${path}`;
    const now = Date.now();
    const current = this.requestCounts.get(key);

    if (!current || now > current.resetTime) {
      // Reset counter
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + (limit.ttl * 1000)
      });
    } else if (current.count >= limit.limit) {
      // Rate limit exceeded
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds.`,
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
    } else {
      // Increment counter
      current.count++;
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limit.limit);
    res.setHeader('X-RateLimit-Remaining', limit.limit - (current?.count || 1));
    res.setHeader('X-RateLimit-Reset', Math.ceil((current?.resetTime || now + limit.ttl * 1000) / 1000));

    next();
  }
}

