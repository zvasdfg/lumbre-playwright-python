import { resolveCartContext } from "../../../server/modules/commerce/cart-context";
import { readCart } from "../../../server/modules/commerce/cart-service";
import { sessionResponse } from "../../../server/modules/sessions/session-service";

export async function GET(request: Request) {
  const context = await resolveCartContext(request);
  const cart = context.mergedCart ?? (await readCart(context.owner));
  return sessionResponse(context.anonymousSession, { data: cart });
}
