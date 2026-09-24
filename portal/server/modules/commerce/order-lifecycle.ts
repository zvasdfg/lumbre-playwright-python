import { and, eq, sql } from "drizzle-orm";
import { getDatabase } from "../../platform/database/client";
import {
  administrativeAuditEvents,
  orders,
} from "../../platform/database/schema";
import { expireHostedCheckout } from "./hosted-checkout";
import { releaseOrderInventory } from "./inventory-service";
import {
  type FulfillmentStatus,
  OrderNotFoundError,
  type OrderView,
  readOrder,
} from "./order-service";

export class OrderCancellationConflictError extends Error {}
export class FulfillmentTransitionConflictError extends Error {}

export async function cancelOrder(
  orderId: string,
  userId: string,
  idempotencyKey: string,
): Promise<{ data: OrderView; created: boolean }> {
  const database = getDatabase();
  const order = await database
    .select({
      status: orders.status,
      inventoryState: orders.inventoryState,
    })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .get();
  if (!order) throw new OrderNotFoundError("Order not found");
  if (order.status === "cancelled") {
    return { data: await readOrder(orderId, userId), created: false };
  }
  if (order.status === "paid" || order.inventoryState === "sold") {
    throw new OrderCancellationConflictError(
      "Paid orders require a refund workflow before cancellation",
    );
  }

  await expireHostedCheckout(orderId);
  if (order.inventoryState === "reserved") {
    const released = await releaseOrderInventory(orderId, {
      orderStatus: "cancelled",
      fulfillmentStatus: "cancelled",
      cancellationKey: idempotencyKey,
    });
    if (released) {
      return { data: await readOrder(orderId, userId), created: true };
    }
  } else {
    const now = new Date().toISOString();
    const cancelled = await database
      .update(orders)
      .set({
        status: "cancelled",
        fulfillmentStatus: "cancelled",
        cancellationKey: idempotencyKey,
        cancelledAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.userId, userId),
          sql`${orders.status} IN ('pending', 'failed')`,
        ),
      )
      .returning({ id: orders.id });
    if (cancelled.length) {
      return { data: await readOrder(orderId, userId), created: true };
    }
  }

  const concurrent = await readOrder(orderId, userId);
  if (concurrent.status === "cancelled") {
    return { data: concurrent, created: false };
  }
  throw new OrderCancellationConflictError("Order cannot be cancelled from its current state");
}

export async function advanceOrderFulfillment(
  orderId: string,
  actorUserId: string,
  target: Extract<FulfillmentStatus, "processing" | "fulfilled">,
): Promise<{ data: OrderView; changed: boolean }> {
  const database = getDatabase();
  const order = await database.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!order) throw new OrderNotFoundError("Order not found");
  if (order.status !== "paid") {
    throw new FulfillmentTransitionConflictError(
      "Only paid orders can advance through fulfillment",
    );
  }
  if (order.fulfillmentStatus === target) {
    return { data: await readOrder(orderId, order.userId), changed: false };
  }

  const expected = target === "processing" ? "unfulfilled" : "processing";
  if (order.fulfillmentStatus !== expected) {
    throw new FulfillmentTransitionConflictError(
      `Fulfillment must advance from ${expected} to ${target}`,
    );
  }

  const now = new Date().toISOString();
  const updated = await database
    .update(orders)
    .set({
      fulfillmentStatus: target,
      fulfilledAt: target === "fulfilled" ? now : null,
      updatedAt: now,
    })
    .where(
      and(
        eq(orders.id, orderId),
        eq(orders.status, "paid"),
        eq(orders.fulfillmentStatus, expected),
      ),
    )
    .returning({ id: orders.id });
  if (!updated.length) {
    throw new FulfillmentTransitionConflictError(
      "Fulfillment changed before this transition was accepted",
    );
  }

  await database.insert(administrativeAuditEvents).values({
    id: crypto.randomUUID(),
    actorUserId,
    resourceType: "order",
    resourceId: orderId,
    action: "updated",
    beforeJson: JSON.stringify({ fulfillmentStatus: order.fulfillmentStatus }),
    afterJson: JSON.stringify({ fulfillmentStatus: target }),
    createdAt: now,
  });
  return { data: await readOrder(orderId, order.userId), changed: true };
}
