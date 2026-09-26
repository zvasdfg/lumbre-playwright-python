import {
  authenticatedUser,
  isAuthenticationEnabled,
} from "../../../server/modules/auth/auth-service";

export async function GET(request: Request) {
  const user = await authenticatedUser(request);
  return Response.json(
    {
      data: user,
      capabilities: { authentication: isAuthenticationEnabled() },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
