import { z } from "zod";

export const addCartItemRequest = z
  .object({
    productId: z.number().int().positive(),
    quantity: z.number().int().min(1).max(20).default(1),
  })
  .strict();

export const updateCartItemRequest = z
  .object({
    quantity: z.number().int().min(1).max(20),
  })
  .strict();

export async function parseJsonBody(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
