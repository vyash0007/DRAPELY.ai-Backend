import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class CartController {
  async getCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      // Get or create user
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      const cart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      res.json({ cart: cart || { items: [] } });
    } catch (error) {
      next(error);
    }
  }

  async addToCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { productId, quantity = 1, size } = req.body;

      if (!productId) {
        throw new AppError(400, 'Product ID is required');
      }

      // Get or create user
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

      // Get or create cart
      let cart = await prisma.cart.findUnique({
        where: { userId: user.id },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId: user.id },
        });
      }

      // Check if item already exists in cart
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          cartId_productId_size: {
            cartId: cart.id,
            productId,
            size: size || '',
          },
        },
      });

      if (existingItem) {
        // Update quantity
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        });
      } else {
        // Create new cart item
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
            size,
          },
        });
      }

      // Return updated cart
      const updatedCart = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      res.json({ cart: updatedCart });
    } catch (error) {
      next(error);
    }
  }

  async updateCartItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { itemId } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        throw new AppError(400, 'Invalid quantity');
      }

      // Verify user owns this cart item
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
          carts: {
            include: {
              items: true,
            },
          },
        },
      });

      if (!user?.carts) {
        throw new AppError(404, 'Cart not found');
      }

      const cartItem = user.carts.items.find(item => item.id === itemId);
      if (!cartItem) {
        throw new AppError(404, 'Cart item not found');
      }

      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });

      // Return updated cart
      const updatedCart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      res.json({ cart: updatedCart });
    } catch (error) {
      next(error);
    }
  }

  async removeFromCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { itemId } = req.params;

      // Verify user owns this cart item
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
          carts: {
            include: {
              items: true,
            },
          },
        },
      });

      if (!user?.carts) {
        throw new AppError(404, 'Cart not found');
      }

      const cartItem = user.carts.items.find(item => item.id === itemId);
      if (!cartItem) {
        throw new AppError(404, 'Cart item not found');
      }

      await prisma.cartItem.delete({
        where: { id: itemId },
      });

      // Return updated cart
      const updatedCart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      res.json({ cart: updatedCart });
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { carts: true },
      });

      if (!user?.carts) {
        throw new AppError(404, 'Cart not found');
      }

      await prisma.cartItem.deleteMany({
        where: { cartId: user.carts.id },
      });

      res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
      next(error);
    }
  }
}
