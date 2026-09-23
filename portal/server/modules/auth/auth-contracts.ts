import { z } from "zod";

export const magicLinkRequest = z
  .object({
    email: z.email(),
    name: z.string().trim().min(2).max(80),
  })
  .strict();

export async function parseJsonBody(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
