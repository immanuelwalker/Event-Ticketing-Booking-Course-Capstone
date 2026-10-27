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

// Money is stored as whole kobo. We only convert to naira when PRINTING.
const naira = (kobo) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    kobo / 100,
  );

const step = (title) => console.log(`\n=== ${title} ===`);

const store = createStore();

// --- 1. An organizer creates an event with one small tier ------------------
step("1. Organizer creates an event and a tier");
const event = createEvent(store, {
  title: "Intro to SQL Workshop",
  city: "Abuja",
  venue: "Hub One, Wuse 2",
  date: "2026-11-14T10:00:00+01:00",
});
const tier = addTier(store, event.id, {
  name: "Student",
  priceKobo: 1_500_000,
  capacity: 3, // deliberately tiny so we can sell it out quickly
});
console.log(`${event.title} in ${event.city}`);
console.log(
  `Tier "${tier.name}": ${naira(tier.priceKobo)} each, ${tier.capacity} seats`,
);

// --- 2. The event sells out -------------------------------------------------
step("2. The tier sells out");
const adaBooking = bookTickets(store, {
  tierId: tier.id,
  quantity: 2,
  attendeeName: "Ada",
});
console.log(
  `Ada booked ${adaBooking.quantity} ticket(s), total ${naira(adaBooking.totalKobo)}, reference ${adaBooking.reference}`,
);
const chidiBooking = bookTickets(store, {
  tierId: tier.id,
  quantity: 1,
  attendeeName: "Chidi",
});
console.log(
  `Chidi booked ${chidiBooking.quantity} ticket(s), reference ${chidiBooking.reference}`,
);
console.log(`Seats left: ${getSeatsLeft(store, tier.id)}`);

// --- 3. A booking is refused ------------------------------------------------
step("3. A booking is refused");
try {
  bookTickets(store, { tierId: tier.id, quantity: 1, attendeeName: "Bola" });
} catch (error) {
  if (!(error instanceof DomainError)) throw error;
  console.log(`Refused with code ${error.code}: ${error.message}`);
}
console.log(`Seats left (unchanged): ${getSeatsLeft(store, tier.id)}`);

// --- 4. People join the waitlist ---------------------------------------------
step("4. Two people join the waitlist");
const bola = joinWaitlist(store, { tierId: tier.id, attendeeName: "Bola" });
console.log(`Bola joined the waitlist at position ${bola.position}`);
const ngozi = joinWaitlist(store, { tierId: tier.id, attendeeName: "Ngozi" });
console.log(`Ngozi joined the waitlist at position ${ngozi.position}`);

// --- 5. Look up a booking quickly by reference ---------------------------------
step("5. Look up a booking by its reference");
const found = findBookingByReference(store, adaBooking.reference.toLowerCase());
console.log(
  `Reference ${adaBooking.reference} -> ${found.attendeeName}, ${found.quantity} ticket(s), status ${found.status}`,
);

// --- 6. A booking is cancelled and the next person is named --------------------
step("6. Ada cancels and the next person in line is named");
const result = cancelBooking(store, adaBooking.reference);
console.log(
  `Booking ${result.booking.reference} is now ${result.booking.status}`,
);
console.log(`Seats left: ${result.seatsLeft}`);
console.log(
  `Next in line: ${result.nextInLine ? result.nextInLine.attendeeName : "nobody"}`,
);

// --- 7. Cancelling twice is an error ---------------------------------------------
step("7. Cancelling the same booking again is refused");
try {
  cancelBooking(store, adaBooking.reference);
} catch (error) {
  if (!(error instanceof DomainError)) throw error;
  console.log(`Refused with code ${error.code}: ${error.message}`);
}
console.log(`Seats left (still): ${getSeatsLeft(store, tier.id)}`);