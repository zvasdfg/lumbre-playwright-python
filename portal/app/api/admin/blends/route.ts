import { authorizeAdministrator } from "../../../../server/modules/catalog/admin-authorization";
import { listBlendsForModeration } from "../../../../server/modules/blends/blend-service";

export async function GET(request: Request) {
  const authorization = await authorizeAdministrator(request);
  if (!authorization.authorized) return authorization.response;
  const data = await listBlendsForModeration();
  return Response.json({ data, count: data.length });
}
