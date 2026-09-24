import {
  parseJsonBody,
  updateCartItemRequest,
} from "../../../../../server/modules/commerce/cart-contracts";
import {
  removeCartItem,
  setCartItemQuantity,
  UnknownProductError,
} from "../../../../../server/modules/commerce/cart-service";
import { resolveWritableCartContext } from "../../../../../server/modules/commerce/cart-context";
import {
  sessionResponse,
} from "../../../../../server/modules/sessions/session-service";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

function parseProductId(value: string): number | null {
  if (!/^[1-9][0-9]*$/.test(value)) return null;
  return Number(value);
}

export async function PATCH(request: Request, routeContext: RouteContext) {
  const { productId: rawProductId } = await routeContext.params;
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

  const cartContext = await resolveWritableCartContext(request);
  try {
    const cart = await setCartItemQuantity(
      cartContext.owner,
      productId,
      parsed.data.quantity,
    );
    return sessionResponse(cartContext.anonymousSession, { data: cart });
  } catch (error) {
    if (error instanceof UnknownProductError) {
      return sessionResponse(
        cartContext.anonymousSession,
        { error: error.message },
        { status: 404 },
      );
    }
    throw error;
  }
}

export async function DELETE(request: Request, routeContext: RouteContext) {
  const { productId: rawProductId } = await routeContext.params;
  const productId = parseProductId(rawProductId);
  if (!productId) {
    return Response.json({ error: "A positive numeric productId is required" }, { status: 422 });
  }

  const cartContext = await resolveWritableCartContext(request);
  const cart = await removeCartItem(cartContext.owner, productId);
  return sessionResponse(cartContext.anonymousSession, { data: cart });
}
