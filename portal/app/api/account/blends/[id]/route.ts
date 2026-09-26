import { authenticatedUser } from "../../../../../server/modules/auth/auth-service";
import {
  archiveUserBlend,
  BlendConflictError,
  BlendNotFoundError,
} from "../../../../../server/modules/blends/blend-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  const user = await authenticatedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });
  try {
    await archiveUserBlend(user.id, (await context.params).id);
    return new Response(null, { status: 204 });
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
