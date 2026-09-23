import { seedVersion } from "../../lib/data";
import { getDatabaseHealth } from "../../../server/platform/database/health";

export async function GET() {
  const database = await getDatabaseHealth(seedVersion);
  const healthy = database.status === "ready";

  return Response.json(
    {
      status: healthy ? "ok" : "degraded",
      service: "lumbre-api",
      seedVersion,
      database,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
