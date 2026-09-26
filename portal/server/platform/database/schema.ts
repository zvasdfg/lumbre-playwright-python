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

export const userBlends = sqliteTable(
  "user_blends",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    signature: text("signature").notNull(),
    title: text("title").notNull(),
    objective: text("objective").notNull(),
    recordJson: text("record_json").notNull(),
    status: text("status", {
      enum: ["draft", "submitted", "published", "rejected", "archived"],
    })
      .notNull()
      .default("draft"),
    moderationNote: text("moderation_note"),
    publishedHypothesisId: text("published_hypothesis_id").references(
      () => hypotheses.id,
      { onDelete: "set null" },
    ),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    submittedAt: text("submitted_at"),
    publishedAt: text("published_at"),
  },
  (table) => [
    uniqueIndex("user_blends_user_signature_unique").on(table.userId, table.signature),
    index("user_blends_user_updated_index").on(table.userId, table.updatedAt),
    index("user_blends_status_updated_index").on(table.status, table.updatedAt),
  ],
);

export const anonymousSessions = sqliteTable(
  "anonymous_sessions",
  {
    id: text("id").primaryKey(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    lastSeenAt: text("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    expiresAt: text("expires_at").notNull(),
  },
  (table) => [index("anonymous_sessions_expires_index").on(table.expiresAt)],
);

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
    inventoryState: text("inventory_state", {
      enum: ["uncommitted", "reserved", "sold", "released"],
    }).notNull().default("uncommitted"),
    inventoryKey: text("inventory_key"),
    fulfillmentStatus: text("fulfillment_status", {
      enum: ["unfulfilled", "processing", "fulfilled", "cancelled"],
    }).notNull().default("unfulfilled"),
    cancellationKey: text("cancellation_key"),
    cancelledAt: text("cancelled_at"),
    fulfilledAt: text("fulfilled_at"),
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

export const hostedCheckoutSessions = sqliteTable(
  "hosted_checkout_sessions",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").notNull(),
    provider: text("provider").notNull(),
    providerSessionId: text("provider_session_id").notNull(),
    checkoutUrl: text("checkout_url").notNull(),
    status: text("status", { enum: ["open", "completed", "expired", "failed"] })
      .notNull()
      .default("open"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("hosted_checkout_order_idempotency_unique").on(
      table.orderId,
      table.idempotencyKey,
    ),
    uniqueIndex("hosted_checkout_provider_session_unique").on(
      table.provider,
      table.providerSessionId,
    ),
  ],
);

export const paymentProviderEvents = sqliteTable(
  "payment_provider_events",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    eventType: text("event_type").notNull(),
    providerObjectId: text("provider_object_id").notNull(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    payloadHash: text("payload_hash").notNull(),
    status: text("status", { enum: ["received", "processed", "failed"] })
      .notNull()
      .default("received"),
    error: text("error"),
    receivedAt: text("received_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    processedAt: text("processed_at"),
  },
  (table) => [
    index("payment_provider_events_order_index").on(table.orderId),
    index("payment_provider_events_status_index").on(table.status),
  ],
);

export const eventReservations = sqliteTable(
  "event_reservations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    eventId: integer("event_id").notNull(),
    eventTitle: text("event_title").notNull(),
    eventCity: text("event_city").notNull(),
    eventDay: text("event_day").notNull(),
    eventMonth: text("event_month").notNull(),
    partySize: integer("party_size").notNull(),
    status: text("status", { enum: ["confirmed", "cancelled"] })
      .notNull()
      .default("confirmed"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("event_reservations_event_user_unique").on(table.eventId, table.userId),
    index("event_reservations_user_created_index").on(table.userId, table.createdAt),
    index("event_reservations_event_status_index").on(table.eventId, table.status),
  ],
);

export const firePlannerPresets = sqliteTable(
  "fire_planner_presets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    guests: integer("guests").notNull(),
    cookingStyle: text("cooking_style", { enum: ["directo", "dos_zonas", "lento"] }).notNull(),
    durationHours: integer("duration_hours").notNull(),
    fuelType: text("fuel_type", { enum: ["carbon", "briquetas", "lena"] }).notNull(),
    equipment: text("equipment", { enum: ["kettle", "abierta", "ahumador"] }).notNull(),
    weather: text("weather", { enum: ["templado", "viento", "frio"] }).notNull(),
    servingTime: text("serving_time").notNull(),
    includeVegetables: integer("include_vegetables", { mode: "boolean" }).notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("fire_planner_presets_user_name_unique").on(
      table.userId,
      table.normalizedName,
    ),
    index("fire_planner_presets_user_updated_index").on(table.userId, table.updatedAt),
  ],
);

export const membershipPreferences = sqliteTable("membership_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => authUser.id, { onDelete: "cascade" }),
  preferredFuel: text("preferred_fuel", {
    enum: ["carbon", "briquetas", "lena"],
  }).notNull(),
  equipment: text("equipment", {
    enum: ["kettle", "abierta", "ahumador"],
  }).notNull(),
  cookingStyle: text("cooking_style", {
    enum: ["directo", "dos_zonas", "lento"],
  }).notNull(),
  defaultGuests: integer("default_guests").notNull(),
  newsletterConsent: integer("newsletter_consent", { mode: "boolean" }).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const catalogProducts = sqliteTable("catalog_products", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category", {
    enum: ["blends", "ropa", "herramientas", "outdoor"],
  }).notNull(),
  price: integer("price").notNull(),
  stock: integer("stock").notNull().default(0),
  badge: text("badge"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  revision: integer("revision").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const catalogEvents = sqliteTable("catalog_events", {
  id: integer("id").primaryKey(),
  day: text("day").notNull(),
  month: text("month").notNull(),
  city: text("city").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  capacity: integer("capacity").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  revision: integer("revision").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const administrativeAuditEvents = sqliteTable(
  "administrative_audit_events",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "restrict" }),
    resourceType: text("resource_type", {
      enum: ["product", "event", "order", "blend"],
    }).notNull(),
    resourceId: text("resource_id").notNull(),
    action: text("action", { enum: ["created", "updated"] }).notNull(),
    beforeJson: text("before_json"),
    afterJson: text("after_json").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("administrative_audit_resource_index").on(
      table.resourceType,
      table.resourceId,
      table.createdAt,
    ),
    index("administrative_audit_actor_index").on(table.actorUserId, table.createdAt),
  ],
);

export const membershipConsentEvents = sqliteTable(
  "membership_consent_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    channel: text("channel", { enum: ["newsletter"] }).notNull(),
    granted: integer("granted", { mode: "boolean" }).notNull(),
    recordedAt: text("recorded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("membership_consent_user_recorded_index").on(table.userId, table.recordedAt)],
);
