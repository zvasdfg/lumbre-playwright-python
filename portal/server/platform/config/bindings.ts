import { env } from "cloudflare:workers";

export function serverBinding(name: string): string | undefined {
  const bindings = env as unknown as Record<string, unknown>;
  const boundValue = bindings[name];
  if (typeof boundValue === "string" && boundValue) return boundValue;
  return process.env[name];
}
