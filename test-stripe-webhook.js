require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function checkWebhookEndpoints() {
  try {
    console.log('=== Checking Stripe Webhook Configuration ===\n');

    const webhookEndpoints = await stripe.webhookEndpoints.list();

    if (webhookEndpoints.data.length === 0) {
      console.log('⚠️  WARNING: No webhook endpoints configured in Stripe!');
      console.log('\nYou need to configure a webhook endpoint in Stripe Dashboard:');
      console.log('1. Go to: https://dashboard.stripe.com/test/webhooks');
      console.log('2. Click "Add endpoint"');
      console.log('3. Enter your webhook URL: https://yourdomain.com/api/webhooks/stripe');
      console.log('4. Select events: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed');
      console.log('5. Copy the webhook signing secret to your .env file as STRIPE_WEBHOOK_SECRET\n');
    } else {
      console.log(`Found ${webhookEndpoints.data.length} webhook endpoint(s):\n`);

      webhookEndpoints.data.forEach((endpoint, index) => {
        console.log(`Endpoint ${index + 1}:`);
        console.log(`  URL: ${endpoint.url}`);
        console.log(`  Status: ${endpoint.status}`);
        console.log(`  Events: ${endpoint.enabled_events.join(', ')}`);
        console.log(`  API Version: ${endpoint.api_version || 'default'}`);
        console.log(`  Created: ${new Date(endpoint.created * 1000).toLocaleString()}`);
        console.log('');
      });
    }

    console.log('\n=== Your Current Configuration ===');
    console.log(`Stripe Secret Key: ${process.env.STRIPE_SECRET_KEY ? '✓ Set' : '✗ Missing'}`);
    console.log(`Webhook Secret: ${process.env.STRIPE_WEBHOOK_SECRET ? '✓ Set' : '✗ Missing'}`);
    console.log(`Backend URL: ${process.env.FRONTEND_URL || 'Not set'}`);

  } catch (error) {
    console.error('Error checking webhook endpoints:', error.message);
  }
}

async function checkRecentEvents() {
  try {
    console.log('\n=== Recent Stripe Events ===\n');

    const events = await stripe.events.list({ limit: 10 });

    console.log(`Found ${events.data.length} recent events:\n`);

    events.data.forEach((event, index) => {
      console.log(`${index + 1}. ${event.type}`);
      console.log(`   Created: ${new Date(event.created * 1000).toLocaleString()}`);
      console.log(`   ID: ${event.id}`);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log(`   Session ID: ${session.id}`);
        console.log(`   Metadata: ${JSON.stringify(session.metadata)}`);
        console.log(`   Payment Status: ${session.payment_status}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('Error checking events:', error.message);
  }
}

async function main() {
  await checkWebhookEndpoints();
  await checkRecentEvents();
}

main();
