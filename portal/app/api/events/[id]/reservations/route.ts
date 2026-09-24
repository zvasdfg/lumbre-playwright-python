import { authenticatedUser } from "../../../../../server/modules/auth/auth-service";
import {
  createReservationRequest,
  parseJsonBody,
} from "../../../../../server/modules/events/reservation-contracts";
import {
  createReservation,
  DuplicateReservationError,
  EventNotFoundError,
  EventSoldOutError,
} from "../../../../../server/modules/events/reservation-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await authenticatedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });

  const eventId = Number((await context.params).id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return Response.json({ error: "A valid event id is required" }, { status: 422 });
  }
  const body = await parseJsonBody(request);
  if (body === null) return Response.json({ error: "A valid JSON body is required" }, { status: 400 });
  const parsed = createReservationRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "partySize must be an integer from 1 to 4" }, { status: 422 });
  }

  try {
    return Response.json(
      await createReservation(eventId, user.id, parsed.data.partySize),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof EventNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof DuplicateReservationError || error instanceof EventSoldOutError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
