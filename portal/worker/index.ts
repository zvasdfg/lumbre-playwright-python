/** Cloudflare Worker entry point for Lumbre. */
import handler from "vinext/server/app-router-entry";
import { getLumbreEnvironment } from "../app/lib/environment";
import { cleanupExpiredAnonymousSessions } from "../server/modules/sessions/session-service";
import { readSessionCookie } from "../server/modules/sessions/session-cookie";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  ABUSE_RATE_LIMITER?: RateLimit;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const testRateLimitKeyHeader = "x-lumbre-test-rate-limit-key";
const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function rateLimitScope(url: URL): string {
  if (url.pathname.startsWith("/api/cart/items")) return "cart";
  if (url.pathname.startsWith("/api/account/magic-link")) return "authentication";
  return url.pathname;
}

function rateLimitActor(request: Request): string {
  if (getLumbreEnvironment() === "test") {
    const testKey = request.headers.get(testRateLimitKeyHeader);
    if (testKey) return `test:${testKey}`;
  }

  const sessionId = readSessionCookie(request);
  if (sessionId) return `session:${sessionId}`;

  const clientAddress =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ??
    "unidentified";
  return `client:${clientAddress}`;
}

function shouldApplyRateLimit(request: Request, url: URL): boolean {
  if (!unsafeMethods.has(request.method) || !url.pathname.startsWith("/api/")) return false;
  if (!url.pathname.startsWith("/api/cart/items")) return false;
  if (getLumbreEnvironment() === "production") return true;
  return getLumbreEnvironment() === "test" && request.headers.has(testRateLimitKeyHeader);
}

function rejectsCrossOriginMutation(request: Request, url: URL): boolean {
  if (!unsafeMethods.has(request.method) || !url.pathname.startsWith("/api/")) return false;
  if (url.pathname === "/api/payments/stripe/webhook") return false;
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return true;
  return request.headers.get("sec-fetch-site") === "cross-site";
}

function withRequestId(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Request-ID", requestId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function sanitizedApiError(requestId: string): Response {
  return Response.json(
    { error: "Unexpected server error", requestId },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}

function logRequest(
  request: Request,
  url: URL,
  response: Response,
  requestId: string,
  startedAt: number,
): void {
  if (getLumbreEnvironment() !== "production" || !url.pathname.startsWith("/api/")) return;
  console.log(JSON.stringify({
    event: "http_request",
    requestId,
    method: request.method,
    path: url.pathname,
    status: response.status,
    durationMs: Date.now() - startedAt,
  }));
}

async function routeRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  return handler.fetch(request, env, ctx);
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    const url = new URL(request.url);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("X-Request-ID", requestId);
    const correlatedRequest = new Request(request, { headers: requestHeaders });
    let response: Response;

    try {
      if (rejectsCrossOriginMutation(correlatedRequest, url)) {
        response = Response.json(
          { error: "Cross-origin mutation rejected", requestId },
          { status: 403, headers: { "Cache-Control": "no-store" } },
        );
      } else if (shouldApplyRateLimit(correlatedRequest, url) && env.ABUSE_RATE_LIMITER) {
        const outcome = await env.ABUSE_RATE_LIMITER.limit({
          key: `${rateLimitScope(url)}:${rateLimitActor(correlatedRequest)}`,
        });
        response = outcome.success
          ? await routeRequest(correlatedRequest, env, ctx)
          : Response.json(
              { error: "Too many requests", requestId },
              {
                status: 429,
                headers: { "Cache-Control": "no-store", "Retry-After": "60" },
              },
            );
      } else {
        response = await routeRequest(correlatedRequest, env, ctx);
      }
    } catch (error) {
      console.error(JSON.stringify({
        event: "request_failed",
        requestId,
        method: request.method,
        path: url.pathname,
        errorName: error instanceof Error ? error.name : "UnknownError",
      }));
      response = url.pathname.startsWith("/api/")
        ? sanitizedApiError(requestId)
        : new Response("Unexpected server error", { status: 500 });
    }

    if (url.pathname.startsWith("/api/") && response.status === 500) {
      console.error(JSON.stringify({
        event: "api_error_sanitized",
        requestId,
        method: request.method,
        path: url.pathname,
      }));
      response = sanitizedApiError(requestId);
    }
    response = withRequestId(response, requestId);
    logRequest(request, url, response, requestId, startedAt);
    return response;
  },

  async scheduled(): Promise<void> {
    const requestId = crypto.randomUUID();
    try {
      const removedSessions = await cleanupExpiredAnonymousSessions();
      console.log(JSON.stringify({
        event: "anonymous_session_cleanup",
        requestId,
        removedSessions,
      }));
    } catch (error) {
      console.error(JSON.stringify({
        event: "maintenance_failed",
        requestId,
        task: "anonymous_session_cleanup",
        errorName: error instanceof Error ? error.name : "UnknownError",
      }));
      throw error;
    }
  },
};

export default worker;
