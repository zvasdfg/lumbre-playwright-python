import { getLumbreEnvironment } from "../../../../lib/environment";
import { expireCurrentSession } from "../../../../../server/modules/auth/auth-service";

export async function POST(request: Request) {
  if (getLumbreEnvironment() !== "test") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const expired = await expireCurrentSession(request);
  if (!expired) {
    return Response.json({ error: "Authentication is required" }, { status: 401 });
  }
  return Response.json({ expired: true });
}
