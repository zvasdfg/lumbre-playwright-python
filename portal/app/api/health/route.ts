import { seedVersion } from "../../lib/data";

export async function GET() {
  return Response.json({ status: "ok", service: "lumbre-api", seedVersion, timestamp: new Date().toISOString() });
}
