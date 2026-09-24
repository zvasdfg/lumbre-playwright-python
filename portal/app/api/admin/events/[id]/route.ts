import {
  parseJsonBody,
  updateEventRequest,
} from "../../../../../server/modules/catalog/admin-contracts";
import { authorizeAdministrator } from "../../../../../server/modules/catalog/admin-authorization";
import {
  CatalogResourceNotFoundError,
  CatalogRevisionConflictError,
  EventCapacityConflictError,
  updateEvent,
} from "../../../../../server/modules/catalog/catalog-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authorization = await authorizeAdministrator(request);
  if (!authorization.authorized) return authorization.response;
  const eventId = Number((await context.params).id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return Response.json({ error: "A valid event id is required" }, { status: 422 });
  }
  const body = await parseJsonBody(request);
  if (body === null) return Response.json({ error: "A valid JSON body is required" }, { status: 400 });
  const parsed = updateEventRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Valid event changes are required" }, { status: 422 });
  }
  try {
    return Response.json({
      data: await updateEvent(authorization.user.id, eventId, parsed.data),
    });
  } catch (error) {
    if (error instanceof CatalogResourceNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof CatalogRevisionConflictError || error instanceof EventCapacityConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
