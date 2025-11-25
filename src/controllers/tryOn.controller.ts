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
      const { person_image, garment_images, collection } = req.body;

      console.log('📥 [BACKEND] Received try-on request:', {
        userId,
        hasPersonImage: !!person_image,
        garmentCount: garment_images ? Object.keys(garment_images).length : 0,
        collection,
      });

      if (!person_image) {
        throw new AppError(400, 'Person image is required');
      }

      if (!garment_images || Object.keys(garment_images).length === 0) {
        throw new AppError(400, 'At least one garment image is required');
      }

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      // Check if user has premium or trial available
      if (!user.hasPremium && user.trialUsed) {
        throw new AppError(403, 'Trial already used. Please subscribe to premium.');
      }

      // Call external Try-On API
      const tryOnApiUrl = process.env.TRY_ON_API_URL;
      const tryOnApiKey = process.env.TRY_ON_API_SECRET_KEY;

      console.log('📤 [BACKEND] Forwarding to external API:', tryOnApiUrl);

      const response = await fetch(`${tryOnApiUrl}/api/try-on`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tryOnApiKey}`,
        },
        body: JSON.stringify({
          person_image,
          garment_images,
          collection,
        }),
      });

      console.log('📨 [BACKEND] External API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [BACKEND] External API error:', errorText);
        throw new AppError(500, 'Try-on processing failed');
      }

      const result = await response.json();
      console.log('✅ [BACKEND] Try-on successful');

      // Mark trial as used if user doesn't have premium
      if (!user.hasPremium && !user.trialUsed) {
        await prisma.user.update({
          where: { id: user.id },
          data: { trialUsed: true },
        });
        console.log('✅ [BACKEND] Trial marked as used');
      }

      res.json({ result });
    } catch (error) {
      next(error);
    }
  }
}
