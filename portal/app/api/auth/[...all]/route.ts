import {
  getAuth,
  isAuthenticationEnabled,
} from "../../../../server/modules/auth/auth-service";

function unavailableResponse(): Response {
  return Response.json(
    { error: "Authentication is not enabled in this environment" },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  if (!isAuthenticationEnabled()) return unavailableResponse();
  return getAuth(request).handler(request);
}

export async function POST(request: Request) {
  if (!isAuthenticationEnabled()) return unavailableResponse();
  return getAuth(request).handler(request);
}
