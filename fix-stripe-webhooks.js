require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const REQUIRED_EVENTS = [
  'checkout.session.completed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
];

async function updateWebhookEndpoints() {
  try {
    console.log('=== Fixing Stripe Webhook Configuration ===\n');

    const webhookEndpoints = await stripe.webhookEndpoints.list();

    if (webhookEndpoints.data.length === 0) {
      console.log('⚠️  No webhook endpoints found.');
      console.log('\nPlease create a webhook endpoint manually:');
      console.log('1. Go to: https://dashboard.stripe.com/test/webhooks');
      console.log('2. Click "Add endpoint"');
      console.log('3. Enter your webhook URL');
      console.log(`4. Add these events: ${REQUIRED_EVENTS.join(', ')}`);
      return;
    }

    console.log(`Found ${webhookEndpoints.data.length} webhook endpoint(s)\n`);

    for (const endpoint of webhookEndpoints.data) {
      console.log(`\n📍 Endpoint: ${endpoint.url}`);
      console.log(`   Current events: ${endpoint.enabled_events.join(', ')}`);

      const missingEvents = REQUIRED_EVENTS.filter(
        event => !endpoint.enabled_events.includes(event)
      );

      if (missingEvents.length === 0) {
        console.log('   ✅ All required events are already configured!');
        continue;
      }

      console.log(`   ⚠️  Missing events: ${missingEvents.join(', ')}`);
      console.log('   Updating webhook endpoint...');

      try {
        // Get current events and add missing ones
        const updatedEvents = [...new Set([...endpoint.enabled_events, ...REQUIRED_EVENTS])];

        await stripe.webhookEndpoints.update(endpoint.id, {
          enabled_events: updatedEvents,
        });

        console.log('   ✅ Webhook endpoint updated successfully!');
        console.log(`   New events: ${updatedEvents.join(', ')}`);
      } catch (error) {
        console.error(`   ❌ Failed to update webhook: ${error.message}`);
      }
    }

    console.log('\n=== Verification ===\n');

    const updatedWebhooks = await stripe.webhookEndpoints.list();
    updatedWebhooks.data.forEach((endpoint, index) => {
      console.log(`Endpoint ${index + 1}: ${endpoint.url}`);
      console.log(`  Events: ${endpoint.enabled_events.join(', ')}`);

      const hasAllRequired = REQUIRED_EVENTS.every(event =>
        endpoint.enabled_events.includes(event)
      );

      if (hasAllRequired) {
        console.log('  ✅ Correctly configured!');
      } else {
        console.log('  ⚠️  Still missing required events!');
      }
      console.log('');
    });

    console.log('\n✅ Webhook configuration complete!');
    console.log('\nNext steps:');
    console.log('1. Test with: stripe trigger checkout.session.completed');
    console.log('2. Or make a test purchase through your app');
    console.log('3. Check backend logs for: [Webhook] Received event: checkout.session.completed');

  } catch (error) {
    console.error('Error updating webhooks:', error.message);
    console.error('\nNote: You may need to update webhooks manually in the Stripe Dashboard');
    console.error('Go to: https://dashboard.stripe.com/test/webhooks');
  }
}

updateWebhookEndpoints();
