import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { store } from '../services/store.js';
import { User } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Check for quick demo override header 'x-user-id'
    const directUserId = req.headers['x-user-id'] as string;
    if (directUserId) {
      const user = store.getUserById(directUserId);
      if (user) {
        req.user = user;
        return next();
      }
    }

    // 2. Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token required (Bearer token or x-user-id)',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string };

    const user = store.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User does not exist' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token',
    });
  }
};

export const requireRole = (role: 'passenger' | 'driver') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: this action requires '${role}' role`,
      });
    }
    return next();
  };
};
