import { authenticatedUser } from "../../../../server/modules/auth/auth-service";
import {
  parseJsonBody,
  syncPresetsRequest,
} from "../../../../server/modules/fire-planner/preset-contracts";
import { syncLocalFirePresets } from "../../../../server/modules/fire-planner/preset-service";

export async function POST(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });
  const body = await parseJsonBody(request);
  if (body === null) return Response.json({ error: "A valid JSON body is required" }, { status: 400 });
  const parsed = syncPresetsRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "A valid preset collection is required" }, { status: 422 });
  }
  return Response.json(await syncLocalFirePresets(user.id, parsed.data.presets));
}
