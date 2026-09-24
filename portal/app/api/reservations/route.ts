import { authenticatedUser } from "../../../server/modules/auth/auth-service";
import { listReservations } from "../../../server/modules/events/reservation-service";

export async function GET(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });
  const data = await listReservations(user.id);
  return Response.json({ data, count: data.length }, { headers: { "Cache-Control": "private, no-store" } });
}
