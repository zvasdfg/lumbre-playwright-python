import {
  createEventRequest,
  parseJsonBody,
} from "../../../../server/modules/catalog/admin-contracts";
import { authorizeAdministrator } from "../../../../server/modules/catalog/admin-authorization";
import {
  createEvent,
  listAdministrativeEvents,
} from "../../../../server/modules/catalog/catalog-service";

export async function GET(request: Request) {
  const authorization = await authorizeAdministrator(request);
  if (!authorization.authorized) return authorization.response;
  const data = await listAdministrativeEvents();
  return Response.json({ data, count: data.length });
}

export async function POST(request: Request) {
  const authorization = await authorizeAdministrator(request);
  if (!authorization.authorized) return authorization.response;
  const body = await parseJsonBody(request);
  if (body === null) return Response.json({ error: "A valid JSON body is required" }, { status: 400 });
  const parsed = createEventRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Valid event data is required" }, { status: 422 });
  }
  const data = await createEvent(authorization.user.id, parsed.data);
  return Response.json({ data, created: true }, { status: 201 });
}
