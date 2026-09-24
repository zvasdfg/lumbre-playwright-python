import {
  authenticatedUser,
  type AuthenticatedUser,
} from "../auth/auth-service";

export type AdministratorAuthorization =
  | { authorized: true; user: AuthenticatedUser }
  | { authorized: false; response: Response };

export async function authorizeAdministrator(
  request: Request,
): Promise<AdministratorAuthorization> {
  const user = await authenticatedUser(request);
  if (!user) {
    return {
      authorized: false,
      response: Response.json({ error: "Authentication is required" }, { status: 401 }),
    };
  }
  if (user.role !== "admin") {
    return {
      authorized: false,
      response: Response.json(
        { error: "Administrator access is required" },
        { status: 403 },
      ),
    };
  }
  return { authorized: true, user };
}
