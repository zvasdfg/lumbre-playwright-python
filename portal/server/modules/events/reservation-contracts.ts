import { z } from "zod";
import { parseJsonBody } from "../commerce/cart-contracts";

export { parseJsonBody };

export const createReservationRequest = z
  .object({
    partySize: z.number().int().min(1).max(4),
  })
  .strict();
