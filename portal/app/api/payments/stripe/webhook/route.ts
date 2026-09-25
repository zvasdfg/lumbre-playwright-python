import {
  isStripeWebhookEnabled,
  InvalidProviderEventError,
  InvalidWebhookSignatureError,
  processStripeWebhook,
  WebhookConfigurationError,
} from "../../../../../server/modules/commerce/stripe-webhook";

export async function POST(request: Request) {
  if (!isStripeWebhookEnabled()) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const signature = request.headers.get("Stripe-Signature");
  if (!signature) return Response.json({ error: "Stripe-Signature is required" }, { status: 400 });
  const rawBody = await request.text();

  try {
    return Response.json(await processStripeWebhook(rawBody, signature));
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      return Response.json({ error: "Webhook signature verification failed" }, { status: 400 });
    }
    if (error instanceof InvalidProviderEventError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    if (error instanceof WebhookConfigurationError) {
      return Response.json({ error: "Webhook processing is not configured" }, { status: 503 });
    }
    throw error;
  }
}
