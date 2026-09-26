import { authenticatedUser } from "../../../../../../server/modules/auth/auth-service";
import {
  BlendConflictError,
  BlendNotFoundError,
  submitUserBlend,
} from "../../../../../../server/modules/blends/blend-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const user = await authenticatedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });
  try {
    return Response.json({ data: await submitUserBlend(user.id, (await context.params).id) });
  } catch (error) {
    if (error instanceof BlendNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof BlendConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
