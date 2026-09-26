import { authorizeAdministrator } from "../../../../../server/modules/catalog/admin-authorization";
import {
  moderateBlendRequest,
  parseJsonBody,
} from "../../../../../server/modules/blends/blend-contracts";
import {
  BlendConflictError,
  BlendNotFoundError,
  moderateUserBlend,
} from "../../../../../server/modules/blends/blend-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authorization = await authorizeAdministrator(request);
  if (!authorization.authorized) return authorization.response;
  const body = await parseJsonBody(request);
  if (body === null) {
    return Response.json({ error: "A valid JSON body is required" }, { status: 400 });
  }
  const parsed = moderateBlendRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "A valid moderation decision is required" }, { status: 422 });
  }
  try {
    const data = await moderateUserBlend(
      authorization.user.id,
      (await context.params).id,
      parsed.data,
    );
    return Response.json({ data });
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
