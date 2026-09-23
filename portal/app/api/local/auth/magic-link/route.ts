import { getLumbreEnvironment } from "../../../../lib/environment";
import { latestMagicLink } from "../../../../../server/modules/auth/auth-service";

export async function GET(request: Request) {
  if (getLumbreEnvironment() === "production") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const email = new URL(request.url).searchParams.get("email")?.trim();
  if (!email) {
    return Response.json({ error: "email is required" }, { status: 422 });
  }

  const url = await latestMagicLink(email);
  if (!url) {
    return Response.json({ error: "Magic link not found" }, { status: 404 });
  }
  return Response.json({ data: { url } }, { headers: { "Cache-Control": "no-store" } });
}
