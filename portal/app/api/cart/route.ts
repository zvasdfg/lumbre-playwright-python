import { resolveReadableCartContext } from "../../../server/modules/commerce/cart-context";
import { readCart } from "../../../server/modules/commerce/cart-service";
import { sessionResponse } from "../../../server/modules/sessions/session-service";

export async function GET(request: Request) {
  const context = await resolveReadableCartContext(request);
  const cart = context.mergedCart ?? (context.owner
    ? await readCart(context.owner)
    : { items: [], totalQuantity: 0, total: 0 });
  return sessionResponse(context.anonymousSession, { data: cart });
}
