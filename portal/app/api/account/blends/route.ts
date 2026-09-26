import { authenticatedUser } from "../../../../server/modules/auth/auth-service";
import {
  createBlendRequest,
  parseJsonBody,
} from "../../../../server/modules/blends/blend-contracts";
import {
  BlendIngredientError,
  createUserBlend,
  listUserBlends,
} from "../../../../server/modules/blends/blend-service";

export async function GET(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });
  const data = await listUserBlends(user.id);
  return Response.json(
    { data, count: data.length },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });
  const body = await parseJsonBody(request);
  if (body === null) {
    return Response.json({ error: "A valid JSON body is required" }, { status: 400 });
  }
  const parsed = createBlendRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "A valid blend is required" }, { status: 422 });
  }
  try {
    const result = await createUserBlend(user.id, parsed.data);
    return Response.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof BlendIngredientError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }
}
