// EstateMotion — Stripe webhook handler.
// Mounted at POST /api/stripe-webhook
// Configure in Stripe Dashboard → Developers → Webhooks → Endpoint URL:
//   https://YOUR-DOMAIN/api/stripe-webhook
// Events to listen for:
//   - checkout.session.completed
//   - customer.subscription.created
//   - customer.subscription.updated
//   - customer.subscription.deleted
//   - invoice.payment_failed
//
// IMPORTANT: This endpoint must receive the RAW request body to verify the
// Stripe signature. On Vercel, that means disabling automatic body parsing
// for this route.

import crypto from "node:crypto";

export const config = {
  api: { bodyParser: false }
};

const TIER_FROM_PRICE = (priceId) => {
  if (priceId === process.env.STRIPE_PRICE_QUICK_REEL) return "quick_reel";
  if (priceId === process.env.STRIPE_PRICE_CINEMATIC_AI) return "cinematic_ai";
  if (priceId === process.env.STRIPE_PRICE_CINEMATIC_4K) return "cinematic_4k";
  return null;
};

const QUOTA_FOR_TIER = {
  trial: 1,
  quick_reel: 10,
  cinematic_ai: 25,
  cinematic_4k: 60
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).end();
  }

  const sig = request.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!webhookSecret) {
    console.warn("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set; rejecting.");
    return response.status(503).end();
  }

  let raw = "";
  for await (const chunk of request) raw += chunk;

  if (!verifySignature(raw, sig, webhookSecret)) {
    console.warn("[stripe-webhook] signature verification failed");
    return response.status(400).send("Invalid signature");
  }

  let event;
  try { event = JSON.parse(raw); } catch {
    return response.status(400).send("Invalid JSON");
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await onCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await onSubscriptionChanged(event.data.object);
        break;
      case "customer.subscription.deleted":
        await onSubscriptionCanceled(event.data.object);
        break;
      case "invoice.payment_failed":
        await onPaymentFailed(event.data.object);
        break;
      default:
        // Ignore unrecognized event types
        break;
    }
    return response.status(200).json({ received: true });
  } catch (error) {
    console.error("[stripe-webhook] handler error", { type: event.type, message: error.message });
    return response.status(500).send("Webhook handler error");
  }
}

async function onCheckoutCompleted(session) {
  const userId = session.client_reference_id || session.metadata?.user_id;
  if (!userId) return;
  await updateProfile(userId, {
    stripe_customer_id: session.customer || null,
    stripe_subscription_id: session.subscription || null,
    subscription_status: "active"
  });
}

async function onSubscriptionChanged(subscription) {
  const userId = subscription.metadata?.user_id || (await findUserByCustomer(subscription.customer));
  if (!userId) return;
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const tier = TIER_FROM_PRICE(priceId) || "trial";
  await updateProfile(userId, {
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    tier,
    monthly_video_quota: QUOTA_FOR_TIER[tier],
    cancel_at_period_end: !!subscription.cancel_at_period_end,
    current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
    // Reset usage at new billing period if period changed
    billing_cycle_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : new Date().toISOString(),
    videos_used_this_month: 0
  });
}

async function onSubscriptionCanceled(subscription) {
  const userId = subscription.metadata?.user_id || (await findUserByCustomer(subscription.customer));
  if (!userId) return;
  await updateProfile(userId, {
    subscription_status: "canceled",
    tier: "trial",
    monthly_video_quota: 1
  });
}

async function onPaymentFailed(invoice) {
  if (!invoice.customer) return;
  const userId = await findUserByCustomer(invoice.customer);
  if (!userId) return;
  await updateProfile(userId, { subscription_status: "past_due" });
}

/* -------------------- Stripe signature verification -------------------- */

function verifySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false;
  const parts = String(signatureHeader).split(",").reduce((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k] = v;
    return acc;
  }, {});
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;
  const payload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  // Constant-time compare
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/* -------------------- Supabase admin -------------------- */

async function findUserByCustomer(customerId) {
  if (!customerId) return null;
  const res = await supabaseAdmin(`profiles?stripe_customer_id=eq.${encodeURIComponent(customerId)}&select=user_id`, "GET");
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) && rows[0] ? rows[0].user_id : null;
}

async function updateProfile(userId, patch) {
  await supabaseAdmin(`profiles?user_id=eq.${encodeURIComponent(userId)}`, "PATCH", patch);
}

async function supabaseAdmin(pathAndQuery, method, body) {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase admin env vars missing.");
  const init = {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    }
  };
  if (body && method !== "GET") init.body = JSON.stringify(body);
  return fetch(`${supabaseUrl}/rest/v1/${pathAndQuery}`, init);
}
