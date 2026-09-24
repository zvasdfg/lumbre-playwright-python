import { listAvailableEvents } from "../../../server/modules/events/reservation-service";

export async function GET() {
  const data = await listAvailableEvents();
  return Response.json({ data, count: data.length });
}
