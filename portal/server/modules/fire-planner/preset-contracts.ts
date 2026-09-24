import { z } from "zod";
import { parseJsonBody } from "../commerce/cart-contracts";

export { parseJsonBody };

const servingTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const plannerConfiguration = z
  .object({
    guests: z.number().int().min(2).max(30),
    cookingStyle: z.enum(["directo", "dos_zonas", "lento"]),
    durationHours: z.union([
      z.literal(2),
      z.literal(4),
      z.literal(6),
      z.literal(8),
      z.literal(12),
    ]),
    fuelType: z.enum(["carbon", "briquetas", "lena"]),
    equipment: z.enum(["kettle", "abierta", "ahumador"]),
    weather: z.enum(["templado", "viento", "frio"]),
    servingTime,
    includeVegetables: z.boolean(),
  })
  .strict();

export const savePresetRequest = z
  .object({
    name: z.string().trim().min(1).max(60),
    configuration: plannerConfiguration,
  })
  .strict();

export const syncPresetsRequest = z
  .object({
    presets: z.array(savePresetRequest).max(20),
  })
  .strict();

export type PresetInput = z.infer<typeof savePresetRequest>;
