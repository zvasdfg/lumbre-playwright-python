import { authenticatedUser, isAuthenticationEnabled } from "../../../server/modules/auth/auth-service";
import { createOrderRequest, idempotencyKey, parseJsonBody } from "../../../server/modules/commerce/order-contracts";
import { createOrder, EmptyCartError, listOrders } from "../../../server/modules/commerce/order-service";
import { commerceUnavailableResponse, isCommerceEnabled } from "../../lib/environment";

async function authorizedUser(request: Request) {
  if (!isAuthenticationEnabled()) return null;
  return authenticatedUser(request);
}

export async function GET(request: Request) {
  if (!isCommerceEnabled()) return commerceUnavailableResponse();
  const user = await authorizedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });
  const data = await listOrders(user.id);
  return Response.json({ data, count: data.length }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  if (!isCommerceEnabled()) return commerceUnavailableResponse();
  const user = await authorizedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });
  const key = idempotencyKey(request);
  if (!key) return Response.json({ error: "A valid Idempotency-Key header is required" }, { status: 400 });

  const body = await parseJsonBody(request);
  if (body === null) return Response.json({ error: "A valid JSON body is required" }, { status: 400 });
  const parsed = createOrderRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Valid customerName, customerEmail, and optional deliveryNotes are required" }, { status: 422 });
  }

  try {
    const result = await createOrder(user.id, parsed.data, key);
    return Response.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof EmptyCartError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
