import { seedVersion } from "../../../lib/data";
import { getLumbreEnvironment } from "../../../lib/environment";
import { resetAnonymousCommerce } from "../../../../server/modules/commerce/cart-service";
import { resetAuthentication } from "../../../../server/modules/auth/auth-service";
import { resetReservations } from "../../../../server/modules/events/reservation-service";
import { resetFirePresets } from "../../../../server/modules/fire-planner/preset-service";
import { resetMembershipPreferences } from "../../../../server/modules/membership/preference-service";
import { resetCatalog } from "../../../../server/modules/catalog/catalog-service";
import { resetHypotheses } from "../../../lib/hypothesis-store";
import { resetUserBlends } from "../../../../server/modules/blends/blend-service";

export async function POST() {
  if (getLumbreEnvironment() !== "test") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await resetAnonymousCommerce();
  await resetReservations();
  await resetFirePresets();
  await resetMembershipPreferences();
  await resetCatalog();
  await resetUserBlends();
  await resetHypotheses();
  await resetAuthentication();
  return Response.json({ reset: true, seedVersion, message: "Demo data restored" });
}
