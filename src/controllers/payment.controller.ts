import { Response, NextFunction } from 'express';
import stripe from '../config/stripe';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class PaymentController {
  async createCheckoutSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new AppError(400, 'Cart items are required');
      }

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      // Get product details
      const productIds = items.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      // Create line items
      const lineItems = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          throw new AppError(404, `Product not found: ${item.productId}`);
        }

        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.title,
              images: product.images.slice(0, 1),
            },
            unit_amount: Math.round(Number(product.price) * 100),
          },
          quantity: item.quantity,
        };
      });

      // Calculate total
      const total = items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + Number(product!.price) * item.quantity;
      }, 0);

      // Create order
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          customerEmail: user.email,
          customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          total,
          status: 'PENDING',
          items: {
            create: items.map(item => {
              const product = products.find(p => p.id === item.productId);
              return {
                productId: item.productId,
                quantity: item.quantity,
                price: product!.price,
                size: item.size,
              };
            }),
          },
        },
      });

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/cart`,
        customer_email: user.email,
        metadata: {
          orderId: order.id,
          userId: user.id,
        },
      });

      // Update order with session ID
      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id },
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      next(error);
    }
  }

  async createPremiumCheckout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      if (user.hasPremium) {
        throw new AppError(400, 'User already has premium');
      }

      // Create Stripe checkout session for premium
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'DRAPELY AI Premium - Virtual Try-On',
                description: 'Unlimited access to AI-powered virtual try-on feature',
              },
              unit_amount: 999, // $9.99
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/tryonyou`,
        customer_email: user.email,
        metadata: {
          userId: user.id,
          type: 'premium',
        },
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      next(error);
    }
  }
}
