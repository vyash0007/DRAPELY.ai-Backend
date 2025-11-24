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

      console.log(`[Webhook] Received event: ${event.type}`, {
        eventId: event.id,
        created: new Date(event.created * 1000).toISOString(),
      });

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as any;

          console.log(`[Webhook] Processing checkout.session.completed`, {
            sessionId: session.id,
            metadata: session.metadata,
            paymentIntent: session.payment_intent,
          });

          if (session.metadata.type === 'premium') {
            // Handle premium subscription
            try {
              await prisma.user.update({
                where: { id: session.metadata.userId },
                data: { hasPremium: true },
              });
              console.log(`[Webhook] Premium subscription activated for user: ${session.metadata.userId}`);
            } catch (error: any) {
              console.error(`[Webhook] Failed to activate premium for user ${session.metadata.userId}:`, error.message);
              throw error;
            }
          } else if (session.metadata.orderId) {
            // Handle order payment
            try {
              // Verify order exists before updating
              const existingOrder = await prisma.order.findUnique({
                where: { id: session.metadata.orderId },
              });

              if (!existingOrder) {
                console.error(`[Webhook] Order not found: ${session.metadata.orderId}`);
                throw new AppError(404, `Order not found: ${session.metadata.orderId}`);
              }

              await prisma.order.update({
                where: { id: session.metadata.orderId },
                data: {
                  status: 'PROCESSING',
                  stripePaymentId: session.payment_intent,
                },
              });

              console.log(`[Webhook] Order updated to PROCESSING: ${session.metadata.orderId}`);

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
                  console.log(`[Webhook] Cart cleared for user: ${order.user.id}`);
                }
              }
            } catch (error: any) {
              console.error(`[Webhook] Failed to process order ${session.metadata.orderId}:`, error.message);
              throw error;
            }
          }
          break;

        case 'payment_intent.succeeded':
          console.log('[Webhook] Payment succeeded:', {
            paymentIntentId: event.data.object.id,
            amount: event.data.object.amount,
          });
          break;

        case 'payment_intent.payment_failed':
          console.error('[Webhook] Payment failed:', {
            paymentIntentId: event.data.object.id,
            error: event.data.object.last_payment_error,
          });
          break;

        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  }
}
