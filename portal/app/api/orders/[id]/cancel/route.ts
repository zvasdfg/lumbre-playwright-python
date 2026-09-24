import { authenticatedUser } from "../../../../../server/modules/auth/auth-service";
import { PaymentProviderUnavailableError } from "../../../../../server/modules/commerce/hosted-checkout";
import {
  cancelOrder,
  OrderCancellationConflictError,
} from "../../../../../server/modules/commerce/order-lifecycle";
import { idempotencyKey } from "../../../../../server/modules/commerce/order-contracts";
import { OrderNotFoundError } from "../../../../../server/modules/commerce/order-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const user = await authenticatedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });
  const key = idempotencyKey(request);
  if (!key) {
    return Response.json(
      { error: "A valid Idempotency-Key header is required" },
      { status: 400 },
    );
  }

  try {
    const result = await cancelOrder((await context.params).id, user.id, key);
    return Response.json(result);
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof OrderCancellationConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof PaymentProviderUnavailableError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
