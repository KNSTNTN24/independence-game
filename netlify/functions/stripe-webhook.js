// netlify/functions/stripe-webhook.js
// Обрабатывает webhook от Stripe и обновляет Premium статус в Supabase

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service key для обхода RLS
);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  console.log('Received event:', stripeEvent.type);

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        const userId = session.metadata?.userId;

        if (userId && session.payment_status === 'paid') {
          // Calculate premium expiration (1 month from now)
          const premiumUntil = new Date();
          premiumUntil.setMonth(premiumUntil.getMonth() + 1);

          // Update user's premium status
          const { error } = await supabase
            .from('profiles')
            .update({
              is_premium: true,
              premium_until: premiumUntil.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (error) {
            console.error('Supabase update error:', error);
          } else {
            console.log(`✅ User ${userId} upgraded to Premium until ${premiumUntil}`);
          }
        }
        break;
      }

      case 'invoice.paid': {
        // Subscription renewal
        const invoice = stripeEvent.data.object;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId = subscription.metadata?.userId;

        if (userId) {
          const premiumUntil = new Date();
          premiumUntil.setMonth(premiumUntil.getMonth() + 1);

          await supabase
            .from('profiles')
            .update({
              is_premium: true,
              premium_until: premiumUntil.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          console.log(`✅ User ${userId} subscription renewed`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        // Subscription canceled
        const subscription = stripeEvent.data.object;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await supabase
            .from('profiles')
            .update({
              is_premium: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          console.log(`❌ User ${userId} subscription canceled`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (error) {
    console.error('Webhook handler error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
