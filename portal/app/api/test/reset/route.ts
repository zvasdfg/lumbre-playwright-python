import { seedVersion } from "../../../lib/data";
import { getLumbreEnvironment } from "../../../lib/environment";

export async function POST() {
  if (getLumbreEnvironment() !== "test") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ reset: true, seedVersion, message: "Demo data restored" });
}
