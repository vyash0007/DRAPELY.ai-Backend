require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function checkRecentWebhookDeliveries() {
  try {
    console.log('=== Checking Recent Webhook Deliveries ===\n');

    // Get recent events
    const events = await stripe.events.list({
      limit: 20,
      types: ['checkout.session.completed']
    });

    console.log(`Found ${events.data.length} checkout.session.completed events:\n`);

    for (const event of events.data) {
      console.log(`\n📍 Event ID: ${event.id}`);
      console.log(`   Created: ${new Date(event.created * 1000).toLocaleString()}`);

      const session = event.data.object;
      console.log(`   Session ID: ${session.id}`);
      console.log(`   Metadata: ${JSON.stringify(session.metadata)}`);
      console.log(`   Payment Status: ${session.payment_status}`);

      // Check webhook endpoints that received this event
      const webhookEndpoints = await stripe.webhookEndpoints.list();

      console.log(`   \n   Webhook Endpoints (${webhookEndpoints.data.length}):`);
      webhookEndpoints.data.forEach((endpoint, idx) => {
        const hasEvent = endpoint.enabled_events.includes('checkout.session.completed');
        console.log(`     ${idx + 1}. ${endpoint.url}`);
        console.log(`        Listening for checkout.session.completed: ${hasEvent ? '✅ YES' : '❌ NO'}`);
        console.log(`        Status: ${endpoint.status}`);
      });
    }

    console.log('\n\n⚠️  PROBLEM DIAGNOSIS:');
    console.log('If you have MULTIPLE webhook endpoints listening for checkout.session.completed,');
    console.log('each endpoint will process the same order, causing stock to be reduced multiple times!\n');

    const webhookEndpoints = await stripe.webhookEndpoints.list();
    const activeEndpoints = webhookEndpoints.data.filter(e =>
      e.status === 'enabled' &&
      e.enabled_events.includes('checkout.session.completed')
    );

    console.log(`You have ${activeEndpoints.length} ACTIVE endpoints listening for checkout.session.completed:`);
    activeEndpoints.forEach((endpoint, idx) => {
      console.log(`  ${idx + 1}. ${endpoint.url}`);
    });

    if (activeEndpoints.length > 1) {
      console.log('\n🔴 ISSUE FOUND: Multiple webhook endpoints are processing the same events!');
      console.log('\n✅ SOLUTION: You should only have ONE webhook endpoint for your backend.');
      console.log('   Disable or delete the other endpoints in Stripe Dashboard.');
      console.log('   Go to: https://dashboard.stripe.com/test/webhooks');
    } else {
      console.log('\n✅ Good: Only 1 webhook endpoint is active.');
      console.log('   The double stock reduction might be caused by:');
      console.log('   1. Webhook being called twice by Stripe (check event logs)');
      console.log('   2. Code being executed twice (check for race conditions)');
      console.log('   3. Manual processing + automatic webhook processing');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkRecentWebhookDeliveries();
