import {
  parseJsonBody,
  updateProductRequest,
} from "../../../../../server/modules/catalog/admin-contracts";
import { authorizeAdministrator } from "../../../../../server/modules/catalog/admin-authorization";
import {
  CatalogResourceNotFoundError,
  CatalogRevisionConflictError,
  updateProduct,
} from "../../../../../server/modules/catalog/catalog-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authorization = await authorizeAdministrator(request);
  if (!authorization.authorized) return authorization.response;
  const productId = Number((await context.params).id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return Response.json({ error: "A valid product id is required" }, { status: 422 });
  }
  const body = await parseJsonBody(request);
  if (body === null) return Response.json({ error: "A valid JSON body is required" }, { status: 400 });
  const parsed = updateProductRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Valid product changes are required" }, { status: 422 });
  }
  try {
    return Response.json({
      data: await updateProduct(authorization.user.id, productId, parsed.data),
    });
  } catch (error) {
    if (error instanceof CatalogResourceNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof CatalogRevisionConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
