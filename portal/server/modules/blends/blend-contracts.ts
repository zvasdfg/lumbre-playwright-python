import { z } from "zod";
import { parseJsonBody } from "../commerce/cart-contracts";

export { parseJsonBody };

export const blendObjectives = [
  "Costra para res",
  "Bark para cocción lenta",
  "Vegetales a las brasas",
  "Pollo al fuego directo",
] as const;

export const createBlendRequest = z
  .object({
    title: z.string().trim().min(3).max(80),
    ingredient_ids: z
      .array(z.string().regex(/^[a-z0-9_]+$/))
      .min(2)
      .max(6)
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "Ingredient identifiers must be unique",
      }),
    objective: z.enum(blendObjectives),
  })
  .strict();

export const moderateBlendRequest = z
  .object({
    decision: z.enum(["approve", "reject"]),
    note: z.string().trim().max(280).optional(),
  })
  .strict()
  .refine((input) => input.decision !== "reject" || Boolean(input.note), {
    message: "A rejection note is required",
    path: ["note"],
  });

export type CreateBlendInput = z.infer<typeof createBlendRequest>;
export type ModerateBlendInput = z.infer<typeof moderateBlendRequest>;
