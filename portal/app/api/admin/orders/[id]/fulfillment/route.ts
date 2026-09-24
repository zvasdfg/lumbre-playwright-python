import { z } from "zod";
import { authorizeAdministrator } from "../../../../../../server/modules/catalog/admin-authorization";
import {
  advanceOrderFulfillment,
  FulfillmentTransitionConflictError,
} from "../../../../../../server/modules/commerce/order-lifecycle";
import { parseJsonBody } from "../../../../../../server/modules/commerce/order-contracts";
import { OrderNotFoundError } from "../../../../../../server/modules/commerce/order-service";

const fulfillmentRequest = z
  .object({ status: z.enum(["processing", "fulfilled"]) })
  .strict();

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authorization = await authorizeAdministrator(request);
  if (!authorization.authorized) return authorization.response;
  const body = await parseJsonBody(request);
  if (body === null) {
    return Response.json({ error: "A valid JSON body is required" }, { status: 400 });
  }
  const parsed = fulfillmentRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "A valid fulfillment status is required" }, { status: 422 });
  }

  try {
    return Response.json(
      await advanceOrderFulfillment(
        (await context.params).id,
        authorization.user.id,
        parsed.data.status,
      ),
    );
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof FulfillmentTransitionConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
