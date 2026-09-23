import { seedVersion } from "../../../lib/data";
import { getLumbreEnvironment } from "../../../lib/environment";
import { resetAnonymousCommerce } from "../../../../server/modules/commerce/cart-service";

export async function POST() {
  if (getLumbreEnvironment() !== "test") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await resetAnonymousCommerce();
  return Response.json({ reset: true, seedVersion, message: "Demo data restored" });
}
