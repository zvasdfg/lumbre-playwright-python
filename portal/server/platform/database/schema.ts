import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { user as authUser } from "../../modules/auth/auth-schema";

export const metadataKeys = {
  seedVersion: "seed_version",
} as const;

export const systemMetadata = sqliteTable("system_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const hypotheses = sqliteTable(
  "hypotheses",
  {
    id: text("id").primaryKey(),
    signature: text("signature").notNull(),
    objective: text("objective").notNull(),
    recordJson: text("record_json").notNull(),
    duplicateCount: integer("duplicate_count").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("hypotheses_signature_unique").on(table.signature)],
);

export const anonymousSessions = sqliteTable("anonymous_sessions", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSeenAt: text("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text("expires_at").notNull(),
});

export const carts = sqliteTable(
  "carts",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .references(() => anonymousSessions.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => authUser.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("carts_session_unique").on(table.sessionId),
    uniqueIndex("carts_user_unique").on(table.userId),
  ],
);

export const cartItems = sqliteTable(
  "cart_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull(),
    quantity: integer("quantity").notNull().default(1),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("cart_items_cart_product_unique").on(table.cartId, table.productId),
    index("cart_items_cart_index").on(table.cartId),
  ],
);

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "restrict" }),
    status: text("status", { enum: ["pending", "paid", "failed", "cancelled"] })
      .notNull()
      .default("pending"),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    deliveryNotes: text("delivery_notes"),
    currency: text("currency").notNull().default("MXN"),
    total: integer("total").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    paidAt: text("paid_at"),
  },
  (table) => [
    uniqueIndex("orders_user_idempotency_unique").on(table.userId, table.idempotencyKey),
    index("orders_user_created_index").on(table.userId, table.createdAt),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull(),
    productName: text("product_name").notNull(),
    productCategory: text("product_category").notNull(),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (table) => [index("order_items_order_index").on(table.orderId)],
);

export const paymentAttempts = sqliteTable(
  "payment_attempts",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").notNull(),
    adapter: text("adapter").notNull().default("local_fake"),
    outcome: text("outcome", { enum: ["approved", "rejected"] }).notNull(),
    amount: integer("amount").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("payment_attempts_order_idempotency_unique").on(
      table.orderId,
      table.idempotencyKey,
    ),
    index("payment_attempts_order_index").on(table.orderId),
  ],
);
