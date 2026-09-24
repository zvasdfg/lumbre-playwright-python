import { and, desc, eq, sql } from "drizzle-orm";
import type { FireEvent } from "../../../app/lib/data";
import {
  findCatalogEvent,
  listPublicEventRecords,
} from "../catalog/catalog-service";
import { getDatabase } from "../../platform/database/client";
import { eventReservations } from "../../platform/database/schema";

export type AvailableEvent = FireEvent & {
  capacity: number;
  reservedSpots: number;
};

export type ReservationView = {
  id: string;
  eventId: number;
  eventTitle: string;
  eventCity: string;
  eventDay: string;
  eventMonth: string;
  partySize: number;
  status: "confirmed" | "cancelled";
  createdAt: string;
};

export class EventNotFoundError extends Error {}
export class DuplicateReservationError extends Error {}
export class EventSoldOutError extends Error {}

async function catalogEvent(eventId: number): Promise<FireEvent> {
  const record = await findCatalogEvent(eventId);
  const event = record
    ? {
        id: record.id,
        day: record.day,
        month: record.month,
        city: record.city,
        title: record.title,
        detail: record.detail,
        spots: record.capacity,
      }
    : null;
  if (!event) throw new EventNotFoundError("Event not found");
  return event;
}

async function confirmedSpots(eventId: number): Promise<number> {
  const records = await getDatabase()
    .select({ partySize: eventReservations.partySize })
    .from(eventReservations)
    .where(
      and(
        eq(eventReservations.eventId, eventId),
        eq(eventReservations.status, "confirmed"),
      ),
    );
  return records.reduce((total, record) => total + record.partySize, 0);
}

export async function listAvailableEvents(): Promise<AvailableEvent[]> {
  const records = await listPublicEventRecords();
  return Promise.all(
    records.map(async (record) => {
      const event: FireEvent = {
        id: record.id,
        day: record.day,
        month: record.month,
        city: record.city,
        title: record.title,
        detail: record.detail,
        spots: record.capacity,
      };
      const reservedSpots = await confirmedSpots(event.id);
      return {
        ...event,
        capacity: event.spots,
        spots: Math.max(event.spots - reservedSpots, 0),
        reservedSpots,
      };
    }),
  );
}

export async function listReservations(userId: string): Promise<ReservationView[]> {
  return getDatabase()
    .select({
      id: eventReservations.id,
      eventId: eventReservations.eventId,
      eventTitle: eventReservations.eventTitle,
      eventCity: eventReservations.eventCity,
      eventDay: eventReservations.eventDay,
      eventMonth: eventReservations.eventMonth,
      partySize: eventReservations.partySize,
      status: eventReservations.status,
      createdAt: eventReservations.createdAt,
    })
    .from(eventReservations)
    .where(eq(eventReservations.userId, userId))
    .orderBy(desc(eventReservations.createdAt));
}

export async function createReservation(
  eventId: number,
  userId: string,
  partySize: number,
): Promise<{ data: ReservationView; event: AvailableEvent }> {
  const event = await catalogEvent(eventId);
  const database = getDatabase();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const result = await database.run(sql`
    INSERT INTO event_reservations (
      id, user_id, event_id, event_title, event_city, event_day, event_month,
      party_size, status, created_at
    )
    SELECT
      ${id}, ${userId}, ${event.id}, ${event.title}, ${event.city}, ${event.day},
      ${event.month}, ${partySize}, 'confirmed', ${createdAt}
    WHERE NOT EXISTS (
      SELECT 1 FROM event_reservations
      WHERE event_id = ${event.id} AND user_id = ${userId}
    )
    AND COALESCE((
      SELECT SUM(party_size) FROM event_reservations
      WHERE event_id = ${event.id} AND status = 'confirmed'
    ), 0) + ${partySize} <= ${event.spots}
  `);

  if (result.meta.changes === 0) {
    const duplicate = await database
      .select({ id: eventReservations.id })
      .from(eventReservations)
      .where(
        and(
          eq(eventReservations.eventId, event.id),
          eq(eventReservations.userId, userId),
        ),
      )
      .get();
    if (duplicate) {
      throw new DuplicateReservationError("The account already has a reservation for this event");
    }
    throw new EventSoldOutError("The event does not have enough available spots");
  }

  const data = (await listReservations(userId)).find((reservation) => reservation.id === id)!;
  const availableEvent = (await listAvailableEvents()).find((candidate) => candidate.id === event.id)!;
  return { data, event: availableEvent };
}

export async function resetReservations(): Promise<void> {
  await getDatabase().delete(eventReservations);
}
