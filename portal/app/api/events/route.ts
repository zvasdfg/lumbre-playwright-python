import { events } from "../../lib/data";

export async function GET() {
  return Response.json({ data: events, count: events.length });
}
