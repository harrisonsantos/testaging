import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as csrf from 'csurf';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfProtection = csrf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }
  });

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for API routes that use JWT tokens
    if (req.path.startsWith('/auth') || req.path.startsWith('/api')) {
      return next();
    }

    // Apply CSRF protection for other routes
    this.csrfProtection(req, res, next);
  }
}

