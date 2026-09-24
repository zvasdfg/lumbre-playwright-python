import { and, eq } from "drizzle-orm";
import { getLumbreEnvironment } from "../../../app/lib/environment";
import { getDatabase } from "../../platform/database/client";
import { serverBinding } from "../../platform/config/bindings";
import { hostedCheckoutSessions } from "../../platform/database/schema";
import { OrderAlreadyPaidError, readOrder } from "./order-service";
import {
  InventoryReservationConflictError,
  releaseOrderInventory,
  reserveOrderInventory,
} from "./inventory-service";

type CheckoutItem = {
  name: string;
  unitPrice: number;
  quantity: number;
};

type CheckoutInput = {
  orderId: string;
  customerEmail: string;
  items: CheckoutItem[];
  origin: string;
};

type ProviderSession = {
  provider: "stripe";
  providerSessionId: string;
  checkoutUrl: string;
};

export type HostedCheckoutView = ProviderSession & {
  orderId: string;
  status: "open" | "completed" | "expired" | "failed";
};

export class PaymentProviderUnavailableError extends Error {}

interface HostedCheckoutPort {
  createSession(input: CheckoutInput, idempotencyKey: string): Promise<ProviderSession>;
  expireSession(providerSessionId: string): Promise<void>;
}

const localStripeSandbox: HostedCheckoutPort = {
  async createSession(input) {
    const providerSessionId = `cs_test_lumbre_${crypto.randomUUID().replaceAll("-", "")}`;
    return {
      provider: "stripe",
      providerSessionId,
      checkoutUrl: `${input.origin}/?checkout=sandbox&session_id=${providerSessionId}`,
    };
  },
  async expireSession() {},
};

const stripeCheckout: HostedCheckoutPort = {
  async createSession(input, idempotencyKey) {
    const secretKey = serverBinding("STRIPE_SECRET_KEY");
    if (!secretKey) {
      throw new PaymentProviderUnavailableError("Stripe Checkout is not configured");
    }

    const form = new URLSearchParams({
      mode: "payment",
      customer_email: input.customerEmail,
      client_reference_id: input.orderId,
      "metadata[order_id]": input.orderId,
      success_url: `${input.origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${input.origin}/?checkout=cancelled`,
    });
    input.items.forEach((item, index) => {
      form.set(`line_items[${index}][price_data][currency]`, "mxn");
      form.set(`line_items[${index}][price_data][unit_amount]`, String(item.unitPrice * 100));
      form.set(`line_items[${index}][price_data][product_data][name]`, item.name);
      form.set(`line_items[${index}][quantity]`, String(item.quantity));
    });

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": idempotencyKey,
      },
      body: form,
    });
    const payload = (await response.json()) as { id?: string; url?: string; error?: { message?: string } };
    if (!response.ok || !payload.id || !payload.url) {
      throw new PaymentProviderUnavailableError(
        payload.error?.message ?? "Stripe Checkout did not return a hosted session",
      );
    }
    return { provider: "stripe", providerSessionId: payload.id, checkoutUrl: payload.url };
  },
  async expireSession(providerSessionId) {
    const secretKey = serverBinding("STRIPE_SECRET_KEY");
    if (!secretKey) {
      throw new PaymentProviderUnavailableError("Stripe Checkout is not configured");
    }
    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${providerSessionId}/expire`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Idempotency-Key": `lumbre-expire-${providerSessionId}`,
        },
      },
    );
    if (!response.ok) {
      throw new PaymentProviderUnavailableError(
        "Stripe Checkout could not expire the hosted session",
      );
    }
  },
};

function checkoutPort(): HostedCheckoutPort {
  if (getLumbreEnvironment() === "test") return localStripeSandbox;
  return serverBinding("PAYMENT_PROVIDER") === "stripe" ? stripeCheckout : localStripeSandbox;
}

export async function createHostedCheckout(
  orderId: string,
  userId: string,
  idempotencyKey: string,
  origin: string,
): Promise<{ data: HostedCheckoutView; created: boolean }> {
  const database = getDatabase();
  const replay = await database
    .select()
    .from(hostedCheckoutSessions)
    .where(
      and(
        eq(hostedCheckoutSessions.orderId, orderId),
        eq(hostedCheckoutSessions.idempotencyKey, idempotencyKey),
      ),
    )
    .get();
  if (replay) {
    return {
      data: {
        orderId,
        provider: "stripe",
        providerSessionId: replay.providerSessionId,
        checkoutUrl: replay.checkoutUrl,
        status: replay.status,
      },
      created: false,
    };
  }

  const order = await readOrder(orderId, userId);
  if (order.status === "paid") throw new OrderAlreadyPaidError("Order is already paid");
  const reservation = await reserveOrderInventory(orderId);
  if (!reservation.created) {
    throw new InventoryReservationConflictError("Order inventory is already reserved");
  }
  let providerSession: ProviderSession;
  try {
    providerSession = await checkoutPort().createSession(
      {
        orderId,
        customerEmail: order.customerEmail,
        items: order.items,
        origin,
      },
      idempotencyKey,
    );
  } catch (error) {
    await releaseOrderInventory(orderId);
    throw error;
  }
  const now = new Date().toISOString();
  await database.insert(hostedCheckoutSessions).values({
    id: crypto.randomUUID(),
    orderId,
    idempotencyKey,
    ...providerSession,
    createdAt: now,
    updatedAt: now,
  });
  return { data: { orderId, status: "open", ...providerSession }, created: true };
}

export async function expireHostedCheckout(orderId: string): Promise<boolean> {
  const database = getDatabase();
  const checkout = await database
    .select()
    .from(hostedCheckoutSessions)
    .where(
      and(
        eq(hostedCheckoutSessions.orderId, orderId),
        eq(hostedCheckoutSessions.status, "open"),
      ),
    )
    .get();
  if (!checkout) return false;

  await checkoutPort().expireSession(checkout.providerSessionId);
  await database
    .update(hostedCheckoutSessions)
    .set({ status: "expired", updatedAt: new Date().toISOString() })
    .where(
      and(
        eq(hostedCheckoutSessions.id, checkout.id),
        eq(hostedCheckoutSessions.status, "open"),
      ),
    );
  return true;
}
