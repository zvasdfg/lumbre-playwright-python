import { desc, eq } from "drizzle-orm";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth/minimal";
import { magicLink } from "better-auth/plugins";
import { getLumbreEnvironment } from "../../../app/lib/environment";
import { getDatabase } from "../../platform/database/client";
import { account, magicLinkDeliveries, session, user, verification } from "./auth-schema";
import {
  deliverMagicLink,
  isAuthenticationDeliveryConfigured,
} from "./magic-link-delivery";

const localSecret = "lumbre-local-auth-secret-not-for-production-2026";

function authSecret(): string {
  const configured = process.env.BETTER_AUTH_SECRET;
  if (configured) return configured;
  if (getLumbreEnvironment() === "production") {
    throw new Error("BETTER_AUTH_SECRET is required in production");
  }
  return localSecret;
}

function authBaseUrl(request?: Request): string {
  if (request && getLumbreEnvironment() !== "production") {
    return new URL(request.url).origin;
  }

  const configured = process.env.BETTER_AUTH_URL;
  if (configured) return configured;
  if (getLumbreEnvironment() === "production") {
    throw new Error("BETTER_AUTH_URL is required in production");
  }
  return "http://localhost:3000";
}

export function isAuthenticationEnabled(): boolean {
  return isAuthenticationDeliveryConfigured();
}

export function getAuth(request?: Request) {
  const baseURL = authBaseUrl(request);
  return betterAuth({
    appName: "Lumbre",
    baseURL,
    secret: authSecret(),
    database: drizzleAdapter(getDatabase(), {
      provider: "sqlite",
      schema: { user, session, account, verification },
      transaction: false,
    }),
    user: {
      additionalFields: {
        role: {
          type: ["customer", "admin"],
          required: false,
          defaultValue: "customer",
          input: false,
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      cookiePrefix: "lumbre_auth",
      useSecureCookies: getLumbreEnvironment() === "production",
      database: {
        generateId: () => crypto.randomUUID(),
      },
    },
    trustedOrigins: [baseURL],
    plugins: [
      magicLink({
        expiresIn: 10 * 60,
        storeToken: "hashed",
        sendMagicLink: async ({ email, url }) => deliverMagicLink(email, url),
      }),
    ],
  });
}

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
};

export type AccountSummary = AuthenticatedUser;

const testAdministrator = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Administración Lumbre",
  email: "admin@lumbre.example.test",
  emailVerified: true,
  role: "admin" as const,
};

export async function authenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  if (!isAuthenticationEnabled()) return null;
  const authSession = await getAuth(request).api.getSession({ headers: request.headers });
  if (!authSession) return null;

  return {
    id: authSession.user.id,
    name: authSession.user.name,
    email: authSession.user.email,
    role: authSession.user.role === "admin" ? "admin" : "customer",
  };
}

export async function latestMagicLink(email: string): Promise<string | null> {
  if (!isAuthenticationEnabled()) return null;
  const delivery = await getDatabase()
    .select({ url: magicLinkDeliveries.url })
    .from(magicLinkDeliveries)
    .where(eq(magicLinkDeliveries.email, email.trim().toLocaleLowerCase("en")))
    .orderBy(desc(magicLinkDeliveries.createdAt))
    .get();
  return delivery?.url ?? null;
}

export async function listAccounts(): Promise<AccountSummary[]> {
  return getDatabase()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .orderBy(user.email)
    .all();
}

export async function expireCurrentSession(request: Request): Promise<boolean> {
  const current = await getAuth(request).api.getSession({ headers: request.headers });
  if (!current) return false;

  await getDatabase()
    .update(session)
    .set({ expiresAt: new Date(0) })
    .where(eq(session.id, current.session.id));
  return true;
}

export async function resetAuthentication(): Promise<void> {
  const database = getDatabase();
  await database.delete(magicLinkDeliveries);
  await database.delete(verification);
  await database.delete(session);
  await database.delete(account);
  await database.delete(user);
  if (getLumbreEnvironment() === "test") {
    await database.insert(user).values(testAdministrator);
  }
}
