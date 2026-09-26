import { authenticatedUser } from "../../../../server/modules/auth/auth-service";
import { OrderNotFoundError, readOrder } from "../../../../server/modules/commerce/order-service";
import { commerceUnavailableResponse, isCommerceEnabled } from "../../../lib/environment";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isCommerceEnabled()) return commerceUnavailableResponse();
  const user = await authenticatedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });
  try {
    return Response.json({ data: await readOrder((await context.params).id, user.id) });
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
