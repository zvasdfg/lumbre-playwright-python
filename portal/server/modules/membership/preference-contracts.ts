import { z } from "zod";
import { parseJsonBody } from "../commerce/cart-contracts";

export { parseJsonBody };

export const updateMembershipPreferencesRequest = z
  .object({
    preferredFuel: z.enum(["carbon", "briquetas", "lena"]),
    equipment: z.enum(["kettle", "abierta", "ahumador"]),
    cookingStyle: z.enum(["directo", "dos_zonas", "lento"]),
    defaultGuests: z.number().int().min(2).max(30),
    newsletterConsent: z.boolean(),
  })
  .strict();

export type MembershipPreferenceInput = z.infer<typeof updateMembershipPreferencesRequest>;
