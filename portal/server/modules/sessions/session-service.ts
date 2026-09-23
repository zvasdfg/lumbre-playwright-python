import { eq } from "drizzle-orm";
import { getDatabase } from "../../platform/database/client";
import { anonymousSessions } from "../../platform/database/schema";
import {
  readSessionCookie,
  serializeSessionCookie,
  sessionTtlSeconds,
} from "./session-cookie";

const sessionIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AnonymousSession = {
  id: string;
  setCookie: string | null;
};

function expirationFrom(now: Date): string {
  return new Date(now.getTime() + sessionTtlSeconds * 1000).toISOString();
}

export async function resolveAnonymousSession(request: Request): Promise<AnonymousSession> {
  const database = getDatabase();
  const now = new Date();
  const cookieSessionId = readSessionCookie(request);

  if (cookieSessionId && sessionIdPattern.test(cookieSessionId)) {
    const existing = await database
      .select({ id: anonymousSessions.id, expiresAt: anonymousSessions.expiresAt })
      .from(anonymousSessions)
      .where(eq(anonymousSessions.id, cookieSessionId))
      .get();

    if (existing && new Date(existing.expiresAt).getTime() > now.getTime()) {
      await database
        .update(anonymousSessions)
        .set({ lastSeenAt: now.toISOString(), expiresAt: expirationFrom(now) })
        .where(eq(anonymousSessions.id, existing.id));
      return { id: existing.id, setCookie: null };
    }

    if (existing) {
      await database.delete(anonymousSessions).where(eq(anonymousSessions.id, existing.id));
    }
  }

  const sessionId = crypto.randomUUID();
  await database.insert(anonymousSessions).values({
    id: sessionId,
    lastSeenAt: now.toISOString(),
    expiresAt: expirationFrom(now),
  });

  return {
    id: sessionId,
    setCookie: serializeSessionCookie(sessionId),
  };
}

export function sessionResponse(
  session: AnonymousSession,
  body: unknown,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store");
  if (session.setCookie) headers.set("Set-Cookie", session.setCookie);
  return Response.json(body, { ...init, headers });
}
