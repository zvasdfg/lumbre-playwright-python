import { z } from "zod";

const email = z.email();
const name = z.string().trim().min(2).max(80);

export const magicLinkRequest = z.union([
  z.object({ mode: z.literal("sign-in"), email }).strict(),
  z.object({ mode: z.literal("sign-up"), name, email }).strict(),
  // Backward compatibility for automation clients created before the UI split.
  z.object({ name, email }).strict(),
]);

export async function parseJsonBody(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
