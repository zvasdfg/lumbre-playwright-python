import { authenticatedUser } from "../../../server/modules/auth/auth-service";
import {
  parseJsonBody,
  savePresetRequest,
} from "../../../server/modules/fire-planner/preset-contracts";
import {
  listFirePresets,
  PresetLimitError,
  saveFirePreset,
} from "../../../server/modules/fire-planner/preset-service";

export async function GET(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });
  const data = await listFirePresets(user.id);
  return Response.json({ data, count: data.length }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });
  const body = await parseJsonBody(request);
  if (body === null) return Response.json({ error: "A valid JSON body is required" }, { status: 400 });
  const parsed = savePresetRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "A valid preset name and fire configuration are required" }, { status: 422 });
  }
  try {
    const result = await saveFirePreset(user.id, parsed.data);
    return Response.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof PresetLimitError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
