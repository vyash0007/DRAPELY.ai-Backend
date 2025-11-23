import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { AppError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError(401, 'Authentication required');
    }

    // Verify the token with Clerk
    const sessionClaims = await clerkClient.verifyToken(token);

    if (!sessionClaims || !sessionClaims.sub) {
      throw new AppError(401, 'Invalid token');
    }

    req.userId = sessionClaims.sub;
    next();
  } catch (error) {
    next(new AppError(401, 'Authentication failed'));
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const sessionClaims = await clerkClient.verifyToken(token);
      if (sessionClaims && sessionClaims.sub) {
        req.userId = sessionClaims.sub;
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
