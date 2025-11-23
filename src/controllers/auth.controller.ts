import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  async syncUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { clerkId, email, firstName, lastName, imageUrl } = req.body;

      if (!clerkId || !email) {
        throw new AppError(400, 'Clerk ID and email are required');
      }

      const user = await prisma.user.upsert({
        where: { clerkId },
        update: {
          email,
          firstName,
          lastName,
          imageUrl,
        },
        create: {
          clerkId,
          email,
          firstName,
          lastName,
          imageUrl,
        },
      });

      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  async getUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          aiEnabled: true,
          hasPremium: true,
          trialUsed: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  async enableAI(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      if (user.aiEnabled) {
        throw new AppError(400, 'AI is already enabled');
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { aiEnabled: true },
      });

      res.json({ user: updatedUser });
    } catch (error) {
      next(error);
    }
  }

  async activatePremium(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { hasPremium: true },
      });

      res.json({ user: updatedUser });
    } catch (error) {
      next(error);
    }
  }
}
