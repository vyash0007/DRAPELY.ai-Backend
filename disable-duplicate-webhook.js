require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function disableDuplicateWebhook() {
  try {
    console.log('=== Fixing Duplicate Webhook Issue ===\n');

    const webhookEndpoints = await stripe.webhookEndpoints.list();
    const activeEndpoints = webhookEndpoints.data.filter(e =>
      e.status === 'enabled' &&
      e.enabled_events.includes('checkout.session.completed')
    );

    if (activeEndpoints.length <= 1) {
      console.log('✅ No duplicate webhooks found. You only have 1 active webhook.');
      process.exit(0);
    }

    console.log(`Found ${activeEndpoints.length} active webhook endpoints:\n`);

    activeEndpoints.forEach((endpoint, idx) => {
      console.log(`${idx + 1}. ${endpoint.url}`);
      console.log(`   ID: ${endpoint.id}`);
      console.log(`   Created: ${new Date(endpoint.created * 1000).toLocaleString()}`);
      console.log('');
    });

    console.log('Which webhook endpoint do you want to KEEP?');
    console.log('(The other endpoints will be DISABLED)\n');

    console.log('Recommendation:');
    console.log('- Keep the one that matches your current production deployment');
    console.log('- If both are production, keep the one you\'re actively using\n');

    rl.question('Enter the number (1 or 2) of the webhook to KEEP: ', async (answer) => {
      const keepIndex = parseInt(answer) - 1;

      if (isNaN(keepIndex) || keepIndex < 0 || keepIndex >= activeEndpoints.length) {
        console.log('Invalid selection. Exiting.');
        rl.close();
        return;
      }

      const keepEndpoint = activeEndpoints[keepIndex];
      console.log(`\n✅ Keeping: ${keepEndpoint.url}`);

      // Disable the others
      for (let i = 0; i < activeEndpoints.length; i++) {
        if (i !== keepIndex) {
          const endpoint = activeEndpoints[i];
          console.log(`\n🔄 Disabling: ${endpoint.url}...`);

          try {
            await stripe.webhookEndpoints.update(endpoint.id, {
              disabled: true
            });
            console.log(`✅ Disabled successfully!`);
          } catch (error) {
            console.error(`❌ Failed to disable: ${error.message}`);
          }
        }
      }

      console.log('\n✅ Done! Only one webhook endpoint is now active.');
      console.log('\n📝 Next steps:');
      console.log('1. Test a new order');
      console.log('2. Stock should now reduce by the correct amount');
      console.log('3. Run: node test-webhook-debug.js to verify\n');

      rl.close();
    });

  } catch (error) {
    console.error('Error:', error.message);
    rl.close();
  }
}

disableDuplicateWebhook();
