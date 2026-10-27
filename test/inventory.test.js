import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createStore,
  createEvent,
  addTier,
  bookTickets,
  cancelBooking,
  findBookingByReference,
  joinWaitlist,
  getSeatsLeft,
} from "../src/domain/inventory.js";
import { DomainError } from "../src/domain/errors.js";

// A small helper so each test starts with a fresh event and a 3-seat tier.
function setup(capacity = 3) {
  const store = createStore();
  const event = createEvent(store, {
    title: "Lagos JavaScript Meetup",
    city: "Lagos",
    venue: "Yaba Hub",
    date: "2026-11-20T18:00:00+01:00",
  });
  const tier = addTier(store, event.id, {
    name: "Standard",
    priceKobo: 500_000,
    capacity,
  });
  return { store, event, tier };
}

// Checks that a function throws a DomainError with the expected code.
function assertDomainError(fn, code) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof DomainError, "should be a DomainError");
    assert.equal(error.code, code);
    return true;
  });
}

test("booking reduces seats left and calculates total in whole kobo", () => {
  const { store, tier } = setup();
  const booking = bookTickets(store, {
    tierId: tier.id,
    quantity: 2,
    attendeeName: "Ada",
  });

  assert.equal(booking.totalKobo, 1_000_000);
  assert.equal(getSeatsLeft(store, tier.id), 1);
});

test("booking more seats than are left throws SOLD_OUT", () => {
  const { store, tier } = setup(2);
  assertDomainError(
    () => bookTickets(store, { tierId: tier.id, quantity: 3, attendeeName: "Ada" }),
    "SOLD_OUT",
  );
});

test("EDGE CASE: a refused booking changes nothing", () => {
  const { store, tier } = setup(2);
  bookTickets(store, { tierId: tier.id, quantity: 1, attendeeName: "Ada" });
  const bookingsBefore = store.bookings.size;

  assert.throws(() =>
    bookTickets(store, { tierId: tier.id, quantity: 5, attendeeName: "Bola" }),
  );

  assert.equal(getSeatsLeft(store, tier.id), 1); // still 1, not corrupted
  assert.equal(store.bookings.size, bookingsBefore); // no stray booking saved
});

test("EDGE CASE: you can book exactly the last seats", () => {
  const { store, tier } = setup(2);
  bookTickets(store, { tierId: tier.id, quantity: 2, attendeeName: "Ada" });
  assert.equal(getSeatsLeft(store, tier.id), 0);
});

test("quantity must be a whole number from 1 to 10", () => {
  const { store, tier } = setup(50);
  for (const bad of [0, -1, 11, 2.5, NaN, Infinity, "3", null, undefined]) {
    assertDomainError(
      () => bookTickets(store, { tierId: tier.id, quantity: bad, attendeeName: "Ada" }),
      "VALIDATION",
    );
  }
  assert.equal(getSeatsLeft(store, tier.id), 50); // nothing changed
});

test("booking an unknown tier throws NOT_FOUND", () => {
  const { store } = setup();
  assertDomainError(
    () => bookTickets(store, { tierId: "nope", quantity: 1, attendeeName: "Ada" }),
    "NOT_FOUND",
  );
});

test("tier price and capacity are validated", () => {
  const { store, event } = setup();
  assertDomainError(
    () => addTier(store, event.id, { name: "X", priceKobo: 10.5, capacity: 5 }),
    "VALIDATION",
  );
  assertDomainError(
    () => addTier(store, event.id, { name: "X", priceKobo: -100, capacity: 5 }),
    "VALIDATION",
  );
  assertDomainError(
    () => addTier(store, event.id, { name: "X", priceKobo: 100, capacity: 0 }),
    "VALIDATION",
  );
});

test("a free tier (price 0) is allowed", () => {
  const { store, event } = setup();
  const tier = addTier(store, event.id, { name: "Free RSVP", priceKobo: 0, capacity: 10 });
  assert.equal(tier.priceKobo, 0);
});

test("event needs title, city, venue and a valid date", () => {
  const store = createStore();
  const good = { title: "T", city: "C", venue: "V", date: "2026-11-20" };
  assertDomainError(() => createEvent(store, { ...good, title: "  " }), "VALIDATION");
  assertDomainError(() => createEvent(store, { ...good, date: "not a date" }), "VALIDATION");
  assertDomainError(() => createEvent(store, { ...good, city: undefined }), "VALIDATION");
});

test("cancelling releases exactly the booked seats", () => {
  const { store, tier } = setup(5);
  const booking = bookTickets(store, { tierId: tier.id, quantity: 3, attendeeName: "Ada" });
  assert.equal(getSeatsLeft(store, tier.id), 2);

  cancelBooking(store, booking.reference);
  assert.equal(getSeatsLeft(store, tier.id), 5);
});

test("EDGE CASE: cancelling twice is an error and does not release seats twice", () => {
  const { store, tier } = setup(5);
  const booking = bookTickets(store, { tierId: tier.id, quantity: 2, attendeeName: "Ada" });
  cancelBooking(store, booking.reference);

  assertDomainError(() => cancelBooking(store, booking.reference), "ALREADY_CANCELLED");
  assert.equal(getSeatsLeft(store, tier.id), 5); // not 7
});

test("cancelling an unknown reference throws NOT_FOUND", () => {
  const { store } = setup();
  assertDomainError(() => cancelBooking(store, "ZZZZ-ZZZZ"), "NOT_FOUND");
});

test("findBookingByReference finds a booking, ignoring case and spaces", () => {
  const { store, tier } = setup();
  const booking = bookTickets(store, { tierId: tier.id, quantity: 1, attendeeName: "Ada" });

  const found = findBookingByReference(store, `  ${booking.reference.toLowerCase()} `);
  assert.equal(found.id, booking.id);
  assert.equal(findBookingByReference(store, "ZZZZ-ZZZZ"), null);
});

test("returned objects are copies: editing them cannot corrupt the store", () => {
  const { store, tier } = setup();
  const booking = bookTickets(store, { tierId: tier.id, quantity: 1, attendeeName: "Ada" });
  booking.quantity = 99;
  booking.status = "hacked";

  const stored = findBookingByReference(store, booking.reference);
  assert.equal(stored.quantity, 1);
  assert.equal(stored.status, "confirmed");
});

test("waitlist: only allowed when sold out", () => {
  const { store, tier } = setup(2);
  assertDomainError(
    () => joinWaitlist(store, { tierId: tier.id, attendeeName: "Bola" }),
    "NOT_SOLD_OUT",
  );
});

test("waitlist: first in line is named after a cancellation", () => {
  const { store, tier } = setup(1);
  const booking = bookTickets(store, { tierId: tier.id, quantity: 1, attendeeName: "Ada" });

  assert.equal(joinWaitlist(store, { tierId: tier.id, attendeeName: "Bola" }).position, 1);
  assert.equal(joinWaitlist(store, { tierId: tier.id, attendeeName: "Ngozi" }).position, 2);

  const result = cancelBooking(store, booking.reference);
  assert.equal(result.nextInLine.attendeeName, "Bola");
  assert.equal(result.seatsLeft, 1);
});

test("waitlist: same person cannot join twice", () => {
  const { store, tier } = setup(1);
  bookTickets(store, { tierId: tier.id, quantity: 1, attendeeName: "Ada" });
  joinWaitlist(store, { tierId: tier.id, attendeeName: "Bola" });

  assertDomainError(
    () => joinWaitlist(store, { tierId: tier.id, attendeeName: " bola " }),
    "ALREADY_WAITLISTED",
  );
});

test("cancelling with nobody waiting names nobody", () => {
  const { store, tier } = setup(1);
  const booking = bookTickets(store, { tierId: tier.id, quantity: 1, attendeeName: "Ada" });
  assert.equal(cancelBooking(store, booking.reference).nextInLine, null);
});