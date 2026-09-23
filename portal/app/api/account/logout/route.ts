import {
  getAuth,
  isAuthenticationEnabled,
} from "../../../../server/modules/auth/auth-service";

export async function POST(request: Request) {
  if (!isAuthenticationEnabled()) {
    return Response.json(
      { error: "Authentication is not enabled in this environment" },
      { status: 503 },
    );
  }

  const target = new URL("/api/auth/sign-out", request.url);
  const headers = new Headers(request.headers);
  headers.set("Content-Type", "application/json");
  if (!headers.has("Origin")) {
    headers.set("Origin", new URL(request.url).origin);
  }
  return getAuth(request).handler(
    new Request(target, {
      method: "POST",
      headers,
      body: "{}",
    }),
  );
}
