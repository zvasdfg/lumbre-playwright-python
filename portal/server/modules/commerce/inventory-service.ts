import { and, eq, sql } from "drizzle-orm";
import { getDatabase } from "../../platform/database/client";
import { catalogProducts, orders } from "../../platform/database/schema";

export class InventoryUnavailableError extends Error {}
export class InventoryReservationConflictError extends Error {}

type InventoryState = "uncommitted" | "reserved" | "sold" | "released";

async function inventoryState(orderId: string): Promise<InventoryState> {
  const row = await getDatabase()
    .select({ inventoryState: orders.inventoryState })
    .from(orders)
    .where(eq(orders.id, orderId))
    .get();
  if (!row) throw new Error("Order does not exist");
  return row.inventoryState;
}

export async function reserveOrderInventory(
  orderId: string,
): Promise<{ created: boolean; state: InventoryState }> {
  const current = await inventoryState(orderId);
  if (current === "reserved" || current === "sold") {
    return { created: false, state: current };
  }

  const database = getDatabase();
  const reservationKey = crypto.randomUUID();
  const now = new Date().toISOString();
  const inventoryAvailable = sql`NOT EXISTS (
    SELECT 1
    FROM order_items AS oi
    JOIN catalog_products AS cp ON cp.id = oi.product_id
    WHERE oi.order_id = ${orderId} AND cp.stock < oi.quantity
  )`;
  const claimOrder = database
    .update(orders)
    .set({
      inventoryState: "reserved",
      inventoryKey: reservationKey,
      updatedAt: now,
    })
    .where(sql`${orders.id} = ${orderId}
      AND ${orders.inventoryState} IN ('uncommitted', 'released')
      AND ${orders.status} <> 'paid'
      AND ${inventoryAvailable}`);
  const decrementInventory = database
    .update(catalogProducts)
    .set({
      stock: sql`${catalogProducts.stock} - COALESCE((
        SELECT oi.quantity FROM order_items AS oi
        WHERE oi.order_id = ${orderId} AND oi.product_id = ${catalogProducts.id}
      ), 0)`,
      revision: sql`${catalogProducts.revision} + 1`,
      updatedAt: now,
    })
    .where(sql`${catalogProducts.id} IN (
        SELECT oi.product_id FROM order_items AS oi WHERE oi.order_id = ${orderId}
      ) AND EXISTS (
        SELECT 1 FROM orders AS inventory_order
        WHERE inventory_order.id = ${orderId}
          AND inventory_order.inventory_key = ${reservationKey}
          AND inventory_order.inventory_state = 'reserved'
      )`);

  await database.batch([claimOrder, decrementInventory]);
  const claimed = await database
    .select({ inventoryState: orders.inventoryState, inventoryKey: orders.inventoryKey })
    .from(orders)
    .where(eq(orders.id, orderId))
    .get();
  if (claimed?.inventoryKey === reservationKey) {
    return { created: true, state: "reserved" };
  }
  if (claimed?.inventoryState === "reserved" || claimed?.inventoryState === "sold") {
    return { created: false, state: claimed.inventoryState };
  }
  throw new InventoryUnavailableError("Insufficient inventory for this order");
}

export async function sellReservedInventory(orderId: string): Promise<void> {
  const now = new Date().toISOString();
  const updated = await getDatabase()
    .update(orders)
    .set({ inventoryState: "sold", status: "paid", paidAt: now, updatedAt: now })
    .where(and(eq(orders.id, orderId), eq(orders.inventoryState, "reserved")))
    .returning({ id: orders.id });
  if (!updated.length) {
    throw new InventoryReservationConflictError("Order inventory is not reserved");
  }
}

export async function releaseOrderInventory(
  orderId: string,
  options: { failOrder: boolean },
): Promise<boolean> {
  if ((await inventoryState(orderId)) !== "reserved") return false;

  const database = getDatabase();
  const releaseKey = crypto.randomUUID();
  const now = new Date().toISOString();
  const claimRelease = database
    .update(orders)
    .set({
      inventoryState: "released",
      inventoryKey: releaseKey,
      ...(options.failOrder ? { status: "failed" as const } : {}),
      updatedAt: now,
    })
    .where(and(eq(orders.id, orderId), eq(orders.inventoryState, "reserved")));
  const restoreInventory = database
    .update(catalogProducts)
    .set({
      stock: sql`${catalogProducts.stock} + COALESCE((
        SELECT oi.quantity FROM order_items AS oi
        WHERE oi.order_id = ${orderId} AND oi.product_id = ${catalogProducts.id}
      ), 0)`,
      revision: sql`${catalogProducts.revision} + 1`,
      updatedAt: now,
    })
    .where(sql`${catalogProducts.id} IN (
        SELECT oi.product_id FROM order_items AS oi WHERE oi.order_id = ${orderId}
      ) AND EXISTS (
        SELECT 1 FROM orders AS inventory_order
        WHERE inventory_order.id = ${orderId}
          AND inventory_order.inventory_key = ${releaseKey}
          AND inventory_order.inventory_state = 'released'
      )`);
  await database.batch([claimRelease, restoreInventory]);
  const released = await database
    .select({ inventoryKey: orders.inventoryKey })
    .from(orders)
    .where(eq(orders.id, orderId))
    .get();
  return released?.inventoryKey === releaseKey;
}
