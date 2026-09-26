import {
  magicLinkRequest,
  parseJsonBody,
} from "../../../../server/modules/auth/auth-contracts";
import {
  accountNameForEmail,
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
    return Response.json({ error: "A valid access request is required" }, { status: 422 });
  }

  const mode = "mode" in parsed.data ? parsed.data.mode : "sign-up";
  const existingName = await accountNameForEmail(parsed.data.email);

  // Keep the response neutral so this endpoint cannot be used to enumerate accounts.
  if (mode === "sign-in" && existingName === null) {
    return Response.json({ status: true });
  }

  const requestedName = "name" in parsed.data ? parsed.data.name : null;
  const accountName = existingName ?? requestedName;
  if (accountName === null) {
    return Response.json({ status: true });
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
      body: JSON.stringify({
        email: parsed.data.email,
        name: accountName,
        callbackURL: "/",
      }),
    }),
  );
}
