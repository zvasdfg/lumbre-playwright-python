import { authenticatedUser } from "../auth/auth-service";
import {
  resolveAnonymousSession,
  resolveExistingAnonymousSession,
  type AnonymousSession,
} from "../sessions/session-service";
import {
  mergeAnonymousCartIntoUser,
  type CartOwner,
  type CartView,
} from "./cart-service";

export type CartContext = {
  anonymousSession: AnonymousSession | null;
  owner: CartOwner | null;
  mergedCart: CartView | null;
};

export async function resolveReadableCartContext(request: Request): Promise<CartContext> {
  const user = await authenticatedUser(request);
  const anonymousSession = await resolveExistingAnonymousSession(request);
  if (user) {
    return {
      anonymousSession,
      owner: { userId: user.id },
      mergedCart: anonymousSession
        ? await mergeAnonymousCartIntoUser(anonymousSession.id, user.id)
        : null,
    };
  }

  return {
    anonymousSession,
    owner: anonymousSession ? { sessionId: anonymousSession.id } : null,
    mergedCart: null,
  };
}

export async function resolveWritableCartContext(
  request: Request,
): Promise<CartContext & { owner: CartOwner }> {
  const user = await authenticatedUser(request);
  const existingAnonymousSession = await resolveExistingAnonymousSession(request);
  if (user) {
    return {
      anonymousSession: existingAnonymousSession,
      owner: { userId: user.id },
      mergedCart: existingAnonymousSession
        ? await mergeAnonymousCartIntoUser(existingAnonymousSession.id, user.id)
        : null,
    };
  }

  const anonymousSession =
    existingAnonymousSession ?? (await resolveAnonymousSession(request));
  return {
    anonymousSession,
    owner: { sessionId: anonymousSession.id },
    mergedCart: null,
  };
}
