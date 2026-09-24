import { z } from "zod";
import { parseJsonBody } from "./cart-contracts";

export { parseJsonBody };

export const createOrderRequest = z
  .object({
    customerName: z.string().trim().min(2).max(100),
    customerEmail: z.email().max(254),
    deliveryNotes: z.string().trim().max(500).optional(),
  })
  .strict();

export const paymentRequest = z
  .object({
    scenario: z.enum(["success", "rejection"]),
  })
  .strict();

export function idempotencyKey(request: Request): string | null {
  const value = request.headers.get("Idempotency-Key")?.trim();
  return value && value.length <= 100 ? value : null;
}
