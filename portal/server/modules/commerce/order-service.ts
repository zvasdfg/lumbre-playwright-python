import { and, desc, eq } from "drizzle-orm";
import { getDatabase } from "../../platform/database/client";
import { orderItems, orders, paymentAttempts } from "../../platform/database/schema";
import { clearCart, readCart } from "./cart-service";
import { localFakePayment, type PaymentScenario } from "./payment-port";

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export type OrderView = {
  id: string;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  deliveryNotes: string | null;
  currency: "MXN";
  total: number;
  items: Array<{
    productId: number;
    name: string;
    category: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  createdAt: string;
  paidAt: string | null;
};

export class EmptyCartError extends Error {}
export class OrderNotFoundError extends Error {}
export class OrderAlreadyPaidError extends Error {}

async function projectOrder(orderId: string, userId: string): Promise<OrderView | null> {
  const database = getDatabase();
  const order = await database
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .get();
  if (!order) return null;

  const items = await database
    .select({
      productId: orderItems.productId,
      name: orderItems.productName,
      category: orderItems.productCategory,
      unitPrice: orderItems.unitPrice,
      quantity: orderItems.quantity,
      lineTotal: orderItems.lineTotal,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
    .orderBy(orderItems.id);

  return {
    id: order.id,
    status: order.status,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    deliveryNotes: order.deliveryNotes,
    currency: "MXN",
    total: order.total,
    items,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
  };
}

export async function createOrder(
  userId: string,
  input: { customerName: string; customerEmail: string; deliveryNotes?: string },
  key: string,
): Promise<{ data: OrderView; created: boolean }> {
  const database = getDatabase();
  const existing = await database
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.idempotencyKey, key)))
    .get();
  if (existing) {
    return { data: (await projectOrder(existing.id, userId))!, created: false };
  }

  const cart = await readCart({ userId });
  if (!cart.items.length) throw new EmptyCartError("The cart is empty");

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await database.insert(orders).values({
    id,
    userId,
    customerName: input.customerName,
    customerEmail: input.customerEmail.toLocaleLowerCase("en"),
    deliveryNotes: input.deliveryNotes || null,
    total: cart.total,
    idempotencyKey: key,
    createdAt,
    updatedAt: createdAt,
  });
  await database.insert(orderItems).values(
    cart.items.map((item) => ({
      orderId: id,
      productId: item.productId,
      productName: item.name,
      productCategory: item.category,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
  );
  return { data: (await projectOrder(id, userId))!, created: true };
}

export async function listOrders(userId: string): Promise<OrderView[]> {
  const rows = await getDatabase()
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
  return Promise.all(rows.map(async ({ id }) => (await projectOrder(id, userId))!));
}

export async function readOrder(orderId: string, userId: string): Promise<OrderView> {
  const order = await projectOrder(orderId, userId);
  if (!order) throw new OrderNotFoundError("Order not found");
  return order;
}

export async function payOrder(
  orderId: string,
  userId: string,
  key: string,
  scenario: PaymentScenario,
): Promise<{ data: OrderView; paymentId: string; outcome: "approved" | "rejected"; created: boolean }> {
  const database = getDatabase();
  const order = await readOrder(orderId, userId);
  const replay = await database
    .select({ id: paymentAttempts.id, outcome: paymentAttempts.outcome })
    .from(paymentAttempts)
    .where(and(eq(paymentAttempts.orderId, orderId), eq(paymentAttempts.idempotencyKey, key)))
    .get();
  if (replay) {
    return { data: await readOrder(orderId, userId), paymentId: replay.id, outcome: replay.outcome, created: false };
  }
  if (order.status === "paid") throw new OrderAlreadyPaidError("Order is already paid");

  const outcome = await localFakePayment.charge(order.total, scenario);
  const paymentId = crypto.randomUUID();
  const now = new Date().toISOString();
  await database.insert(paymentAttempts).values({
    id: paymentId,
    orderId,
    idempotencyKey: key,
    outcome,
    amount: order.total,
    createdAt: now,
  });
  await database
    .update(orders)
    .set({
      status: outcome === "approved" ? "paid" : "failed",
      updatedAt: now,
      paidAt: outcome === "approved" ? now : null,
    })
    .where(eq(orders.id, orderId));
  if (outcome === "approved") await clearCart({ userId });

  return { data: await readOrder(orderId, userId), paymentId, outcome, created: true };
}
