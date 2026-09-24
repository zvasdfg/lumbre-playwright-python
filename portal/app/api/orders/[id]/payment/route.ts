import { authenticatedUser } from "../../../../../server/modules/auth/auth-service";
import { idempotencyKey, parseJsonBody, paymentRequest } from "../../../../../server/modules/commerce/order-contracts";
import { InventoryUnavailableError, OrderAlreadyPaidError, OrderNotFoundError, payOrder } from "../../../../../server/modules/commerce/order-service";
import { InventoryReservationConflictError } from "../../../../../server/modules/commerce/inventory-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await authenticatedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });
  const key = idempotencyKey(request);
  if (!key) return Response.json({ error: "A valid Idempotency-Key header is required" }, { status: 400 });
  const body = await parseJsonBody(request);
  if (body === null) return Response.json({ error: "A valid JSON body is required" }, { status: 400 });
  const parsed = paymentRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "scenario must be success or rejection" }, { status: 422 });
  }

  try {
    const result = await payOrder((await context.params).id, user.id, key, parsed.data.scenario);
    return Response.json(result, { status: result.outcome === "approved" ? 200 : 402 });
  } catch (error) {
    if (error instanceof OrderNotFoundError) return Response.json({ error: error.message }, { status: 404 });
    if (error instanceof OrderAlreadyPaidError) return Response.json({ error: error.message }, { status: 409 });
    if (error instanceof InventoryUnavailableError) return Response.json({ error: error.message }, { status: 409 });
    if (error instanceof InventoryReservationConflictError) return Response.json({ error: error.message }, { status: 409 });
    throw error;
  }
}
