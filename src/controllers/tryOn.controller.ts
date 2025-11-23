import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class TryOnController {
  async processTryOn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { personImage, garmentImage } = req.body;

      if (!personImage || !garmentImage) {
        throw new AppError(400, 'Person image and garment image are required');
      }

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      if (!user.hasPremium) {
        throw new AppError(403, 'Premium subscription required');
      }

      // Call external Try-On API
      const tryOnApiUrl = process.env.TRY_ON_API_URL;
      const tryOnApiKey = process.env.TRY_ON_API_SECRET_KEY;

      const response = await fetch(`${tryOnApiUrl}/api/try-on`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tryOnApiKey}`,
        },
        body: JSON.stringify({
          personImage,
          garmentImage,
        }),
      });

      if (!response.ok) {
        throw new AppError(500, 'Try-on processing failed');
      }

      const result = await response.json();

      res.json({ result });
    } catch (error) {
      next(error);
    }
  }

  async processTrial(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { personImage, garmentImage } = req.body;

      if (!personImage || !garmentImage) {
        throw new AppError(400, 'Person image and garment image are required');
      }

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      if (user.trialUsed) {
        throw new AppError(403, 'Trial already used. Please subscribe to premium.');
      }

      // Call external Try-On API
      const tryOnApiUrl = process.env.TRY_ON_API_URL;
      const tryOnApiKey = process.env.TRY_ON_API_SECRET_KEY;

      const response = await fetch(`${tryOnApiUrl}/api/try-on`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tryOnApiKey}`,
        },
        body: JSON.stringify({
          personImage,
          garmentImage,
        }),
      });

      if (!response.ok) {
        throw new AppError(500, 'Try-on processing failed');
      }

      const result = await response.json();

      // Mark trial as used
      await prisma.user.update({
        where: { id: user.id },
        data: { trialUsed: true },
      });

      res.json({ result });
    } catch (error) {
      next(error);
    }
  }
}
