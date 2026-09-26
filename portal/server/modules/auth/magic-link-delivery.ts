import { getLumbreEnvironment } from "../../../app/lib/environment";
import { getDatabase } from "../../platform/database/client";
import { magicLinkDeliveries } from "./auth-schema";

type MagicLinkDeliveryProvider = "disabled" | "outbox" | "resend";

function normalizedEmail(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

function configuredProvider(): MagicLinkDeliveryProvider {
  const configured = process.env.AUTH_EMAIL_PROVIDER;
  if (configured === "disabled" || configured === "outbox" || configured === "resend") {
    return configured;
  }
  return getLumbreEnvironment() === "production" ? "disabled" : "outbox";
}

export function isAuthenticationDeliveryConfigured(): boolean {
  return configuredProvider() !== "disabled";
}

function requiredSetting(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for production authentication`);
  return value;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function deliverToLocalOutbox(email: string, url: string): Promise<void> {
  await getDatabase().insert(magicLinkDeliveries).values({
    id: crypto.randomUUID(),
    email: normalizedEmail(email),
    url,
  });
}

async function deliverWithResend(email: string, url: string): Promise<void> {
  const recipient = normalizedEmail(email);
  const allowedRecipient = normalizedEmail(requiredSetting("AUTH_ALLOWED_EMAIL"));

  // Until Lumbre owns a verified sending domain, production access is intentionally
  // restricted to one operator email. Suppression is silent to avoid disclosing it.
  if (recipient !== allowedRecipient) return;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requiredSetting("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.AUTH_EMAIL_FROM?.trim() || "Lumbre <onboarding@resend.dev>",
      to: [recipient],
      subject: "Tu enlace de acceso a Lumbre",
      text: `Entra a Lumbre con este enlace. Vence en diez minutos y sólo puede utilizarse una vez:\n\n${url}`,
      html: `<p>Entra a Lumbre con este enlace.</p><p><a href="${escapeHtml(url)}">Abrir Lumbre</a></p><p>Vence en diez minutos y sólo puede utilizarse una vez.</p>`,
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`Transactional email provider rejected the request (${response.status})`);
  }
}

export async function deliverMagicLink(email: string, url: string): Promise<void> {
  const provider = configuredProvider();
  if (provider === "outbox") {
    await deliverToLocalOutbox(email, url);
    return;
  }
  if (provider === "resend") {
    await deliverWithResend(email, url);
    return;
  }
  throw new Error("Production authentication delivery is not configured");
}
