import {
  addCartItemRequest,
  parseJsonBody,
} from "../../../../server/modules/commerce/cart-contracts";
import {
  addCartItem,
  UnknownProductError,
} from "../../../../server/modules/commerce/cart-service";
import { resolveWritableCartContext } from "../../../../server/modules/commerce/cart-context";
import {
  sessionResponse,
} from "../../../../server/modules/sessions/session-service";

export async function POST(request: Request) {
  const body = await parseJsonBody(request);
  if (body === null) {
    return Response.json({ error: "A valid JSON body is required" }, { status: 400 });
  }

  const parsed = addCartItemRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "productId and an optional quantity from 1 to 20 are required" },
      { status: 422 },
    );
  }

  const context = await resolveWritableCartContext(request);
  try {
    const cart = await addCartItem(
      context.owner,
      parsed.data.productId,
      parsed.data.quantity,
    );
    return sessionResponse(context.anonymousSession, { data: cart }, { status: 201 });
  } catch (error) {
    if (error instanceof UnknownProductError) {
      return sessionResponse(
        context.anonymousSession,
        { error: error.message },
        { status: 404 },
      );
    }
    throw error;
  }
}
