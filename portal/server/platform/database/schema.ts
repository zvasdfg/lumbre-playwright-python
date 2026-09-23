import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
