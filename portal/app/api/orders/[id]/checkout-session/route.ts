import { authenticatedUser } from "../../../../../server/modules/auth/auth-service";
import { createHostedCheckout, PaymentProviderUnavailableError } from "../../../../../server/modules/commerce/hosted-checkout";
import { idempotencyKey } from "../../../../../server/modules/commerce/order-contracts";
import { OrderAlreadyPaidError, OrderNotFoundError } from "../../../../../server/modules/commerce/order-service";
import { InventoryReservationConflictError, InventoryUnavailableError } from "../../../../../server/modules/commerce/inventory-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await authenticatedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });
  const key = idempotencyKey(request);
  if (!key) return Response.json({ error: "A valid Idempotency-Key header is required" }, { status: 400 });

  try {
    const result = await createHostedCheckout(
      (await context.params).id,
      user.id,
      key,
      new URL(request.url).origin,
    );
    return Response.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof OrderNotFoundError) return Response.json({ error: error.message }, { status: 404 });
    if (error instanceof OrderAlreadyPaidError) return Response.json({ error: error.message }, { status: 409 });
    if (error instanceof InventoryUnavailableError || error instanceof InventoryReservationConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof PaymentProviderUnavailableError) {
      return Response.json({ error: "Hosted checkout is temporarily unavailable" }, { status: 503 });
    }
    throw error;
  }
}
