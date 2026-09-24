import {
  createProductRequest,
  parseJsonBody,
} from "../../../../server/modules/catalog/admin-contracts";
import { authorizeAdministrator } from "../../../../server/modules/catalog/admin-authorization";
import {
  createProduct,
  listAdministrativeProducts,
} from "../../../../server/modules/catalog/catalog-service";

export async function GET(request: Request) {
  const authorization = await authorizeAdministrator(request);
  if (!authorization.authorized) return authorization.response;
  const data = await listAdministrativeProducts();
  return Response.json({ data, count: data.length });
}

export async function POST(request: Request) {
  const authorization = await authorizeAdministrator(request);
  if (!authorization.authorized) return authorization.response;
  const body = await parseJsonBody(request);
  if (body === null) return Response.json({ error: "A valid JSON body is required" }, { status: 400 });
  const parsed = createProductRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Valid product data is required" }, { status: 422 });
  }
  const data = await createProduct(authorization.user.id, parsed.data);
  return Response.json({ data, created: true }, { status: 201 });
}
