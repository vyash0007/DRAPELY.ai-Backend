import { Request, Response, NextFunction } from 'express';
import stripe from '../config/stripe';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class WebhookController {
  async handleStripeWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        throw new AppError(400, `Webhook Error: ${err.message}`);
      }

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as any;

          if (session.metadata.type === 'premium') {
            // Handle premium subscription
            await prisma.user.update({
              where: { id: session.metadata.userId },
              data: { hasPremium: true },
            });
          } else if (session.metadata.orderId) {
            // Handle order payment
            await prisma.order.update({
              where: { id: session.metadata.orderId },
              data: {
                status: 'PROCESSING',
                stripePaymentId: session.payment_intent,
              },
            });

            // Clear user's cart
            const order = await prisma.order.findUnique({
              where: { id: session.metadata.orderId },
              include: { user: true },
            });

            if (order?.user) {
              const cart = await prisma.cart.findUnique({
                where: { userId: order.user.id },
              });

              if (cart) {
                await prisma.cartItem.deleteMany({
                  where: { cartId: cart.id },
                });
              }
            }
          }
          break;

        case 'payment_intent.succeeded':
          console.log('Payment succeeded:', event.data.object);
          break;

        case 'payment_intent.payment_failed':
          console.log('Payment failed:', event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  }
}
