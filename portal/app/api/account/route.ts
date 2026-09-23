import { authenticatedUser } from "../../../server/modules/auth/auth-service";

export async function GET(request: Request) {
  const user = await authenticatedUser(request);
  return Response.json({ data: user }, { headers: { "Cache-Control": "private, no-store" } });
}
