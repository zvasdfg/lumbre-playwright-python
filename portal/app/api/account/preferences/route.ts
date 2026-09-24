import { authenticatedUser } from "../../../../server/modules/auth/auth-service";
import {
  parseJsonBody,
  updateMembershipPreferencesRequest,
} from "../../../../server/modules/membership/preference-contracts";
import {
  getMembershipPreferences,
  saveMembershipPreferences,
} from "../../../../server/modules/membership/preference-service";

export async function GET(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });
  return Response.json(await getMembershipPreferences(user.id), {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function PUT(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });
  const body = await parseJsonBody(request);
  if (body === null) return Response.json({ error: "A valid JSON body is required" }, { status: 400 });
  const parsed = updateMembershipPreferencesRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Valid membership preferences are required" }, { status: 422 });
  }
  const result = await saveMembershipPreferences(user.id, parsed.data);
  return Response.json(result, { status: result.created ? 201 : 200 });
}
