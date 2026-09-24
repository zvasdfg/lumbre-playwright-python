import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getLumbreEnvironment } from "../../../app/lib/environment";
import { getDatabase } from "../../platform/database/client";
import { serverBinding } from "../../platform/config/bindings";
import {
  hostedCheckoutSessions,
  orders,
  paymentProviderEvents,
} from "../../platform/database/schema";
import { clearCart } from "./cart-service";
import { releaseOrderInventory, sellReservedInventory } from "./inventory-service";

const stripeEvent = z.object({
  id: z.string().min(1),
  type: z.enum([
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed",
    "checkout.session.expired",
  ]),
  data: z.object({
    object: z.object({
      id: z.string().min(1),
      amount_total: z.number().int().nonnegative(),
      currency: z.string(),
      payment_status: z.string(),
      metadata: z.object({ order_id: z.string().uuid() }),
    }),
  }),
});

export class InvalidWebhookSignatureError extends Error {}
export class InvalidProviderEventError extends Error {}
export class WebhookConfigurationError extends Error {}

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function verifySignature(rawBody: string, signatureHeader: string): Promise<void> {
  const secret =
    serverBinding("STRIPE_WEBHOOK_SECRET") ??
    (getLumbreEnvironment() === "test"
      ? "whsec_lumbre_test_webhook_secret_2026"
      : undefined);
  if (!secret) throw new WebhookConfigurationError("Stripe webhook signing is not configured");
  const parts = signatureHeader.split(",").map((part) => part.split("=", 2));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !signatures.length || !/^\d+$/.test(timestamp)) {
    throw new InvalidWebhookSignatureError("Stripe-Signature is malformed");
  }
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    throw new InvalidWebhookSignatureError("Stripe-Signature timestamp is outside tolerance");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = hex(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${rawBody}`)),
  );
  if (!signatures.some((signature) => constantTimeEqual(signature, expected))) {
    throw new InvalidWebhookSignatureError("Stripe-Signature verification failed");
  }
}

async function sha256(value: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

export async function processStripeWebhook(rawBody: string, signature: string) {
  await verifySignature(rawBody, signature);
  let decoded: unknown;
  try {
    decoded = JSON.parse(rawBody);
  } catch {
    throw new InvalidProviderEventError("Stripe event body is not valid JSON");
  }
  const parsed = stripeEvent.safeParse(decoded);
  if (!parsed.success) throw new InvalidProviderEventError("Stripe event contract is invalid");

  const event = parsed.data;
  const object = event.data.object;
  const database = getDatabase();
  const checkout = await database
    .select()
    .from(hostedCheckoutSessions)
    .where(
      and(
        eq(hostedCheckoutSessions.provider, "stripe"),
        eq(hostedCheckoutSessions.providerSessionId, object.id),
        eq(hostedCheckoutSessions.orderId, object.metadata.order_id),
      ),
    )
    .get();
  if (!checkout) throw new InvalidProviderEventError("Checkout session does not match an order");
  const order = await database.select().from(orders).where(eq(orders.id, checkout.orderId)).get();
  if (!order) throw new InvalidProviderEventError("Order does not exist");
  if (object.currency.toLocaleLowerCase("en") !== "mxn" || object.amount_total !== order.total * 100) {
    throw new InvalidProviderEventError("Provider amount or currency does not match the order");
  }

  const existing = await database
    .select({ status: paymentProviderEvents.status })
    .from(paymentProviderEvents)
    .where(eq(paymentProviderEvents.id, event.id))
    .get();
  if (existing?.status === "processed") {
    return { received: true, duplicate: true, eventId: event.id, orderId: order.id, status: order.status };
  }

  const now = new Date().toISOString();
  if (!existing) {
    await database.insert(paymentProviderEvents).values({
      id: event.id,
      provider: "stripe",
      eventType: event.type,
      providerObjectId: object.id,
      orderId: order.id,
      payloadHash: await sha256(rawBody),
      receivedAt: now,
    });
  } else {
    await database
      .update(paymentProviderEvents)
      .set({ status: "received", error: null })
      .where(eq(paymentProviderEvents.id, event.id));
  }

  try {
    const approved =
      event.type === "checkout.session.async_payment_succeeded" ||
      (event.type === "checkout.session.completed" && object.payment_status === "paid");
    const failed =
      event.type === "checkout.session.async_payment_failed" ||
      event.type === "checkout.session.expired";

    if (approved && order.status !== "paid") {
      await sellReservedInventory(order.id);
      await clearCart({ userId: order.userId });
    } else if (failed && order.status !== "paid") {
      await releaseOrderInventory(order.id, { failOrder: true });
    }

    await database
      .update(hostedCheckoutSessions)
      .set({
        status: approved ? "completed" : failed ? (event.type === "checkout.session.expired" ? "expired" : "failed") : "completed",
        updatedAt: now,
      })
      .where(eq(hostedCheckoutSessions.id, checkout.id));
    await database
      .update(paymentProviderEvents)
      .set({ status: "processed", processedAt: now, error: null })
      .where(eq(paymentProviderEvents.id, event.id));
  } catch (error) {
    await database
      .update(paymentProviderEvents)
      .set({ status: "failed", error: error instanceof Error ? error.message : "Unknown error" })
      .where(eq(paymentProviderEvents.id, event.id));
    throw error;
  }

  const updated = await database.select({ status: orders.status }).from(orders).where(eq(orders.id, order.id)).get();
  return { received: true, duplicate: false, eventId: event.id, orderId: order.id, status: updated!.status };
}
