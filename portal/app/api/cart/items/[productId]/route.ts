import {
  parseJsonBody,
  updateCartItemRequest,
} from "../../../../../server/modules/commerce/cart-contracts";
import {
  removeCartItem,
  setCartItemQuantity,
  UnknownProductError,
} from "../../../../../server/modules/commerce/cart-service";
import {
  resolveAnonymousSession,
  sessionResponse,
} from "../../../../../server/modules/sessions/session-service";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

function parseProductId(value: string): number | null {
  if (!/^[1-9][0-9]*$/.test(value)) return null;
  return Number(value);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { productId: rawProductId } = await context.params;
  const productId = parseProductId(rawProductId);
  if (!productId) {
    return Response.json({ error: "A positive numeric productId is required" }, { status: 422 });
  }

  const body = await parseJsonBody(request);
  if (body === null) {
    return Response.json({ error: "A valid JSON body is required" }, { status: 400 });
  }
  const parsed = updateCartItemRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "quantity from 1 to 20 is required" }, { status: 422 });
  }

  const session = await resolveAnonymousSession(request);
  try {
    const cart = await setCartItemQuantity(session.id, productId, parsed.data.quantity);
    return sessionResponse(session, { data: cart });
  } catch (error) {
    if (error instanceof UnknownProductError) {
      return sessionResponse(session, { error: error.message }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { productId: rawProductId } = await context.params;
  const productId = parseProductId(rawProductId);
  if (!productId) {
    return Response.json({ error: "A positive numeric productId is required" }, { status: 422 });
  }

  const session = await resolveAnonymousSession(request);
  const cart = await removeCartItem(session.id, productId);
  return sessionResponse(session, { data: cart });
}
