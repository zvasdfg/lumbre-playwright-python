import { authorizeAdministrator } from "../../../../server/modules/catalog/admin-authorization";
import { listAuditEvents } from "../../../../server/modules/catalog/catalog-service";

export async function GET(request: Request) {
  const authorization = await authorizeAdministrator(request);
  if (!authorization.authorized) return authorization.response;
  const data = await listAuditEvents();
  return Response.json({ data, count: data.length });
}
