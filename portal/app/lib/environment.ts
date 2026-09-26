export type LumbreEnvironment = "development" | "test" | "production";

const supportedEnvironments = new Set<LumbreEnvironment>([
  "development",
  "test",
  "production",
]);

export function getLumbreEnvironment(): LumbreEnvironment {
  const configuredEnvironment =
    process.env.LUMBRE_ENV ?? process.env.NEXT_PUBLIC_LUMBRE_ENV;

  if (
    configuredEnvironment &&
    supportedEnvironments.has(configuredEnvironment as LumbreEnvironment)
  ) {
    return configuredEnvironment as LumbreEnvironment;
  }

  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export function isProductionReadOnly(): boolean {
  return getLumbreEnvironment() === "production";
}

export function isPublicProductionReadOnly(): boolean {
  const publicEnvironment = process.env.NEXT_PUBLIC_LUMBRE_ENV;

  if (publicEnvironment && supportedEnvironments.has(publicEnvironment as LumbreEnvironment)) {
    return publicEnvironment === "production";
  }

  return process.env.NODE_ENV === "production";
}

export function isPublicAuthenticationEnabled(): boolean {
  const configured = process.env.NEXT_PUBLIC_AUTH_ENABLED;
  if (configured === "true") return true;
  if (configured === "false") return false;
  return !isPublicProductionReadOnly();
}

export function isCommerceEnabled(): boolean {
  if (getLumbreEnvironment() !== "production") return true;
  return process.env.COMMERCE_ENABLED === "true";
}

export function commerceUnavailableResponse(): Response {
  return Response.json(
    { error: "Commerce is not enabled in this environment" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

export function readOnlyResponse(allowedMethods: string[] = ["GET"]): Response {
  return Response.json(
    { error: "This operation is not available in the read-only production environment" },
    {
      status: 405,
      headers: allowedMethods.length > 0 ? { Allow: allowedMethods.join(", ") } : undefined,
    },
  );
}
