const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentOrders() {
  console.log('\n=== Checking Recent Orders ===');

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      user: true,
      items: {
        include: {
          product: true
        }
      }
    }
  });

  console.log(`Found ${orders.length} recent orders:\n`);

  orders.forEach(order => {
    console.log(`Order ID: ${order.id}`);
    console.log(`  Status: ${order.status}`);
    console.log(`  User: ${order.user.email}`);
    console.log(`  Total: $${order.total}`);
    console.log(`  Stripe Payment ID: ${order.stripePaymentId || 'NONE - WEBHOOK NOT PROCESSED!'}`);
    console.log(`  Created: ${order.createdAt}`);
    console.log(`  Items: ${order.items.length}`);
    order.items.forEach(item => {
      console.log(`    - ${item.product.name} (Qty: ${item.quantity}, Size: ${item.size || 'N/A'})`);
    });
    console.log('');
  });
}

async function checkPremiumUsers() {
  console.log('\n=== Checking Premium Users ===');

  const premiumUsers = await prisma.user.findMany({
    where: { hasPremium: true },
    orderBy: { updatedAt: 'desc' }
  });

  console.log(`Found ${premiumUsers.length} users with premium:\n`);

  premiumUsers.forEach(user => {
    console.log(`User: ${user.email}`);
    console.log(`  Premium: ${user.hasPremium}`);
    console.log(`  AI Enabled: ${user.aiEnabled}`);
    console.log(`  Updated: ${user.updatedAt}`);
    console.log('');
  });
}

async function checkRecentUsers() {
  console.log('\n=== Checking Recent Users ===');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log(`Found ${users.length} recent users:\n`);

  users.forEach(user => {
    console.log(`User: ${user.email}`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Clerk ID: ${user.clerkId}`);
    console.log(`  Premium: ${user.hasPremium}`);
    console.log(`  AI Enabled: ${user.aiEnabled}`);
    console.log(`  Created: ${user.createdAt}`);
    console.log('');
  });
}

async function checkProductStock() {
  console.log('\n=== Checking Product Stock ===');

  const products = await prisma.product.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: {
      sizeStocks: true
    }
  });

  console.log(`Found ${products.length} recently updated products:\n`);

  products.forEach(product => {
    console.log(`Product: ${product.name}`);
    console.log(`  Total Stock: ${product.stock}`);
    console.log(`  Updated: ${product.updatedAt}`);
    if (product.sizeStocks.length > 0) {
      console.log(`  Size Stock:`);
      product.sizeStocks.forEach(size => {
        console.log(`    - ${size.size}: ${size.quantity}`);
      });
    }
    console.log('');
  });
}

async function main() {
  try {
    console.log('=== DRAPELY.AI Database Diagnosis ===');
    console.log('Checking for webhook processing issues...\n');

    await checkRecentOrders();
    await checkPremiumUsers();
    await checkRecentUsers();
    await checkProductStock();

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
