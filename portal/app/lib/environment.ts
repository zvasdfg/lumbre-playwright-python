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

export function readOnlyResponse(allowedMethods: string[] = ["GET"]): Response {
  return Response.json(
    { error: "This operation is not available in the read-only production environment" },
    {
      status: 405,
      headers: allowedMethods.length > 0 ? { Allow: allowedMethods.join(", ") } : undefined,
    },
  );
}
