import {
  magicLinkRequest,
  parseJsonBody,
} from "../../../../server/modules/auth/auth-contracts";
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

  const body = await parseJsonBody(request);
  if (body === null) {
    return Response.json({ error: "A valid JSON body is required" }, { status: 400 });
  }
  const parsed = magicLinkRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "A valid email and name are required" }, { status: 422 });
  }

  const target = new URL("/api/auth/sign-in/magic-link", request.url);
  const headers = new Headers(request.headers);
  headers.set("Content-Type", "application/json");
  if (!headers.has("Origin")) {
    headers.set("Origin", new URL(request.url).origin);
  }
  return getAuth(request).handler(
    new Request(target, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...parsed.data, callbackURL: "/" }),
    }),
  );
}
