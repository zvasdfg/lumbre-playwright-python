import { getLumbreEnvironment } from "../../../app/lib/environment";

export const sessionCookieName = "lumbre_session";
export const sessionTtlSeconds = 60 * 60 * 24 * 30;

export function readSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(";")) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name === sessionCookieName) {
      try {
        return decodeURIComponent(valueParts.join("="));
      } catch {
        return null;
      }
    }
  }

  return null;
}

export function serializeSessionCookie(sessionId: string): string {
  const attributes = [
    `${sessionCookieName}=${encodeURIComponent(sessionId)}`,
    "Path=/",
    `Max-Age=${sessionTtlSeconds}`,
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (getLumbreEnvironment() === "production") {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}
