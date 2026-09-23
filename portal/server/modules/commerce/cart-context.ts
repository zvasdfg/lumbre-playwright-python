import { authenticatedUser } from "../auth/auth-service";
import {
  resolveAnonymousSession,
  type AnonymousSession,
} from "../sessions/session-service";
import {
  mergeAnonymousCartIntoUser,
  type CartOwner,
  type CartView,
} from "./cart-service";

export type CartContext = {
  anonymousSession: AnonymousSession;
  owner: CartOwner;
  mergedCart: CartView | null;
};

export async function resolveCartContext(request: Request): Promise<CartContext> {
  const anonymousSession = await resolveAnonymousSession(request);
  const user = await authenticatedUser(request);
  if (!user) {
    return {
      anonymousSession,
      owner: { sessionId: anonymousSession.id },
      mergedCart: null,
    };
  }

  return {
    anonymousSession,
    owner: { userId: user.id },
    mergedCart: await mergeAnonymousCartIntoUser(anonymousSession.id, user.id),
  };
}
