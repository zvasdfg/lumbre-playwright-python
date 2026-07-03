import { seedVersion } from "../../../lib/data";

export async function POST() {
  return Response.json({ reset: true, seedVersion, message: "Demo data restored" });
}
