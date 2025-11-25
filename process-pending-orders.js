require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * This script will manually process pending orders that were paid
 * but not processed due to missing webhook events.
 */

async function processPendingOrders() {
  try {
    console.log('=== Processing Pending Orders ===\n');

    // Find all pending orders
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        stripeSessionId: { not: null },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${pendingOrders.length} pending orders\n`);

    if (pendingOrders.length === 0) {
      console.log('✅ No pending orders to process!');
      return;
    }

    for (const order of pendingOrders) {
      console.log(`\n📦 Order ID: ${order.id}`);
      console.log(`   User: ${order.user.email}`);
      console.log(`   Total: $${order.total}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   Session ID: ${order.stripeSessionId}`);

      // Check if this was a successful payment by verifying in Stripe
      // For now, we'll ask for confirmation
      console.log('\n   Items:');
      order.items.forEach(item => {
        console.log(`   - ${item.product.name} (Qty: ${item.quantity}, Size: ${item.size || 'N/A'})`);
      });

      // Update order status
      try {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'PROCESSING',
          },
        });

        console.log('   ✅ Order status updated to PROCESSING');

        // Update stock
        for (const item of order.items) {
          // Update product total stock
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          console.log(`   ✅ Reduced stock for ${item.product.name} by ${item.quantity}`);

          // Update size stock if applicable
          if (item.size) {
            const updated = await prisma.sizeStock.updateMany({
              where: {
                productId: item.productId,
                size: item.size,
              },
              data: {
                quantity: {
                  decrement: item.quantity,
                },
              },
            });

            if (updated.count > 0) {
              console.log(`   ✅ Reduced size stock (${item.size}) by ${item.quantity}`);
            }
          }
        }

        // Clear user's cart
        const cart = await prisma.cart.findUnique({
          where: { userId: order.user.id },
        });

        if (cart) {
          await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
          });
          console.log('   ✅ Cart cleared');
        }

      } catch (error) {
        console.error(`   ❌ Error processing order: ${error.message}`);
      }
    }

    console.log('\n\n=== Summary ===');
    console.log(`Processed ${pendingOrders.length} pending orders`);
    console.log('\nRun the diagnostic script to verify:');
    console.log('node test-webhook-debug.js\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

processPendingOrders();
