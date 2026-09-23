import { readCart } from "../../../server/modules/commerce/cart-service";
import {
  resolveAnonymousSession,
  sessionResponse,
} from "../../../server/modules/sessions/session-service";

export async function GET(request: Request) {
  const session = await resolveAnonymousSession(request);
  const cart = await readCart(session.id);
  return sessionResponse(session, { data: cart });
}
