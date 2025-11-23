import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class WishlistController {
  async getWishlist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // If no userId, return empty wishlist (user not authenticated)
      if (!req.userId) {
        return res.json({ wishlistItems: [] });
      }

      const userId = req.userId;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        // User not found in database, return empty wishlist
        return res.json({ wishlistItems: [] });
      }

      const wishlistItems = await prisma.wishlistItem.findMany({
        where: { userId: user.id },
        include: {
          product: {
            include: {
              category: true,
              sizeStocks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ wishlistItems });
    } catch (error) {
      next(error);
    }
  }

  async addToWishlist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { productId } = req.body;

      if (!productId) {
        throw new AppError(400, 'Product ID is required');
      }

      let user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      // Verify product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new AppError(404, 'Product not found');
      }

      // Check if already in wishlist
      const existingItem = await prisma.wishlistItem.findUnique({
        where: {
          userId_productId: {
            userId: user.id,
            productId,
          },
        },
      });

      if (existingItem) {
        throw new AppError(400, 'Product already in wishlist');
      }

      const wishlistItem = await prisma.wishlistItem.create({
        data: {
          userId: user.id,
          productId,
        },
        include: {
          product: {
            include: {
              category: true,
              sizeStocks: true,
            },
          },
        },
      });

      res.json({ wishlistItem });
    } catch (error) {
      next(error);
    }
  }

  async removeFromWishlist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { productId } = req.params;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      const wishlistItem = await prisma.wishlistItem.findUnique({
        where: {
          userId_productId: {
            userId: user.id,
            productId,
          },
        },
      });

      if (!wishlistItem) {
        throw new AppError(404, 'Wishlist item not found');
      }

      await prisma.wishlistItem.delete({
        where: { id: wishlistItem.id },
      });

      res.json({ message: 'Removed from wishlist successfully' });
    } catch (error) {
      next(error);
    }
  }
}
