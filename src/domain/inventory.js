import { DomainError, ErrorCodes } from "./errors.js";
import { newId, newReference } from "./ids.js";
import { Queue } from "./waitlistQueue.js";

// ---------------------------------------------------------------------------
// The store
// ---------------------------------------------------------------------------
// Everything lives in memory inside one object. There is no database yet
// (that arrives in Build 5). Each Map is keyed by an id so we can find things
// instantly instead of scanning a list.
//
//   events    id        -> event
//   tiers     id        -> tier
//   bookings  reference -> booking   <- this Map gives O(1) lookup by reference
//   waitlists tierId    -> { queue, names }

export const MAX_TICKETS_PER_BOOKING = 10;

export function createStore() {
  return {
    events: new Map(),
    tiers: new Map(),
    bookings: new Map(),
    waitlists: new Map(),
  };
}

// ---------------------------------------------------------------------------
// Validation helpers (private to this file)
// ---------------------------------------------------------------------------
// Rule of this module: VALIDATE EVERYTHING FIRST, CHANGE THINGS AFTERWARDS.
// If anything is wrong we throw before touching the store, so a failed call
// leaves no half-finished changes behind.

function fail(code, message) {
  throw new DomainError(code, message);
}

function requireText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(ErrorCodes.VALIDATION, `${field} must be a non-empty text value`);
  }
  return value.trim();
}

function requireInteger(value, field, { min, max = Number.MAX_SAFE_INTEGER }) {
  // Number.isInteger rejects 2.5, NaN, Infinity, and strings like "3".
  if (!Number.isInteger(value) || value < min || value > max) {
    fail(
      ErrorCodes.VALIDATION,
      `${field} must be a whole number from ${min} to ${max}`,
    );
  }
  return value;
}

function requireDate(value, field) {
  const parsed = new Date(value);
  if (
    !(typeof value === "string" || value instanceof Date) ||
    Number.isNaN(parsed.getTime())
  ) {
    fail(ErrorCodes.VALIDATION, `${field} must be a valid date`);
  }
  return parsed.toISOString();
}

function getTier(store, tierId) {
  const tier = store.tiers.get(tierId);
  if (!tier) fail(ErrorCodes.NOT_FOUND, `No ticket tier with id ${tierId}`);
  return tier;
}

function seatsLeft(tier) {
  return tier.capacity - tier.sold;
}

// Callers receive COPIES, never the real objects inside the store. Otherwise
// outside code could write tier.sold = 0 and quietly break the capacity rule.
function copy(object) {
  return { ...object };
}

function normaliseReference(reference) {
  return typeof reference === "string" ? reference.trim().toUpperCase() : "";
}

// ---------------------------------------------------------------------------
// Events and tiers
// ---------------------------------------------------------------------------

/**
 * Create an event. (S02, rules only. Publishing arrives in Build 2.)
 * @returns the new event
 */
export function createEvent(store, { title, city, venue, date }) {
  const event = {
    id: newId(),
    title: requireText(title, "title"),
    city: requireText(city, "city"),
    venue: requireText(venue, "venue"),
    date: requireDate(date, "date"),
    tierIds: [],
  };
  store.events.set(event.id, event);
  return copy(event);
}

/**
 * Add a ticket tier to an event. (S03, rules only.)
 * Price is in whole kobo and can be 0 for free tickets.
 * Capacity must be at least 1.
 */
export function addTier(store, eventId, { name, priceKobo, capacity }) {
  const event = store.events.get(eventId);
  if (!event) fail(ErrorCodes.NOT_FOUND, `No event with id ${eventId}`);

  const tier = {
    id: newId(),
    eventId,
    name: requireText(name, "name"),
    priceKobo: requireInteger(priceKobo, "priceKobo", { min: 0 }),
    capacity: requireInteger(capacity, "capacity", { min: 1 }),
    sold: 0,
  };

  // Only now that every field is valid do we change the store.
  store.tiers.set(tier.id, tier);
  event.tierIds.push(tier.id);
  return { ...copy(tier), seatsLeft: seatsLeft(tier) };
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

/**
 * Book 1 to 10 tickets from one tier. (S06, rules only.)
 * If there are not enough seats, throws SOLD_OUT and changes nothing.
 */
export function bookTickets(store, { tierId, quantity, attendeeName }) {
  // 1. Validate everything.
  const name = requireText(attendeeName, "attendeeName");
  const count = requireInteger(quantity, "quantity", {
    min: 1,
    max: MAX_TICKETS_PER_BOOKING,
  });
  const tier = getTier(store, tierId);

  // 2. Check the capacity rule.
  const remaining = seatsLeft(tier);
  if (count > remaining) {
    fail(
      ErrorCodes.SOLD_OUT,
      remaining === 0
        ? `"${tier.name}" is sold out`
        : `Only ${remaining} seat(s) left in "${tier.name}", you asked for ${count}`,
    );
  }

  // 3. Prepare the booking. Make a reference that is not already used.
  let reference = newReference();
  while (store.bookings.has(reference)) {
    reference = newReference();
  }

  const booking = {
    id: newId(),
    reference,
    eventId: tier.eventId,
    tierId: tier.id,
    attendeeName: name,
    quantity: count,
    totalKobo: tier.priceKobo * count, // whole kobo times a whole number = whole kobo
    status: "confirmed", // payment arrives in Build 4; for now a booking is simply confirmed
    createdAt: new Date().toISOString(),
  };

  // 4. Only now change the store. These lines cannot fail.
  tier.sold += count;
  store.bookings.set(reference, booking);

  return copy(booking);
}

/**
 * Cancel a booking and release its seats.
 * Cancelling a second time is an error.
 *
 * Returns the cancelled booking and `nextInLine`: the person at the front of
 * that tier's waitlist (or null). We only NAME them here. We do not remove
 * them from the line or give them a seat. Offering seats comes in Build 8.
 */
export function cancelBooking(store, reference) {
  const booking = store.bookings.get(normaliseReference(reference));
  if (!booking) {
    fail(ErrorCodes.NOT_FOUND, `No booking with reference ${reference}`);
  }
  if (booking.status === "cancelled") {
    fail(
      ErrorCodes.ALREADY_CANCELLED,
      `Booking ${booking.reference} is already cancelled`,
    );
  }

  const tier = getTier(store, booking.tierId);

  booking.status = "cancelled";
  tier.sold -= booking.quantity; // release exactly the seats this booking held

  const waitlist = store.waitlists.get(tier.id);
  const next = waitlist ? waitlist.queue.peek() : undefined;

  return {
    booking: copy(booking),
    seatsLeft: seatsLeft(tier),
    nextInLine: next ? copy(next) : null,
  };
}

/**
 * Find a booking by its reference code in O(1) using a Map.
 * Returns the booking, or null when there is no such booking. (Searching and
 * finding nothing is a normal answer, not an error.)
 */
export function findBookingByReference(store, reference) {
  const booking = store.bookings.get(normaliseReference(reference));
  return booking ? copy(booking) : null;
}

// ---------------------------------------------------------------------------
// Waitlist
// ---------------------------------------------------------------------------

/**
 * Join the waitlist for a sold-out tier. First in, first out.
 * - Only allowed while the tier is sold out.
 * - The same person cannot join the same waitlist twice.
 * Returns their position in line (1 = front).
 */
export function joinWaitlist(store, { tierId, attendeeName }) {
  const name = requireText(attendeeName, "attendeeName");
  const tier = getTier(store, tierId);

  if (seatsLeft(tier) > 0) {
    fail(
      ErrorCodes.NOT_SOLD_OUT,
      `"${tier.name}" still has ${seatsLeft(tier)} seat(s). Book instead of waiting`,
    );
  }

  let waitlist = store.waitlists.get(tier.id);
  if (!waitlist) {
    // `names` is a Set so "is this person already waiting?" is an O(1) check.
    waitlist = { queue: new Queue(), names: new Set() };
    store.waitlists.set(tier.id, waitlist);
  }

  const key = name.toLowerCase();
  if (waitlist.names.has(key)) {
    fail(ErrorCodes.ALREADY_WAITLISTED, `${name} is already on this waitlist`);
  }

  waitlist.names.add(key);
  waitlist.queue.enqueue({
    attendeeName: name,
    tierId: tier.id,
    joinedAt: new Date().toISOString(),
  });

  return { position: waitlist.queue.size };
}

/** Helper for demos and later builds: how many seats are left in a tier. */
export function getSeatsLeft(store, tierId) {
  return seatsLeft(getTier(store, tierId));
}