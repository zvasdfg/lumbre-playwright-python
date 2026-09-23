import {
  authenticatedUser,
  isAuthenticationEnabled,
  listAccounts,
} from "../../../../server/modules/auth/auth-service";

export async function GET(request: Request) {
  if (!isAuthenticationEnabled()) {
    return Response.json(
      { error: "Authentication is not enabled in this environment" },
      { status: 503 },
    );
  }

  const requester = await authenticatedUser(request);
  if (!requester) {
    return Response.json({ error: "Authentication is required" }, { status: 401 });
  }
  if (requester.role !== "admin") {
    return Response.json({ error: "Administrator access is required" }, { status: 403 });
  }

  const accounts = await listAccounts();
  return Response.json({ data: accounts, count: accounts.length });
}
