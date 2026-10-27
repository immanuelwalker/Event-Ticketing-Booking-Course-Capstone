import { performance } from "node:perf_hooks";
import {
  createStore,
  createEvent,
  addTier,
  bookTickets,
  findBookingByReference,
} from "../src/domain/inventory.js";

// How many bookings to create, and how many lookups to time.
const BOOKINGS = 100_000;
const LOOKUPS = 1_000;

// --- Setup: create one big event with many bookings --------------------------
const store = createStore();
const event = createEvent(store, {
  title: "West Africa DevCon",
  city: "Lagos",
  venue: "Convention Centre",
  date: "2026-12-05T09:00:00+01:00",
});
const tier = addTier(store, event.id, {
  name: "Standard",
  priceKobo: 3_500_000,
  capacity: BOOKINGS, // big enough for every booking below
});

console.log(`Creating ${BOOKINGS.toLocaleString()} bookings...`);
for (let i = 0; i < BOOKINGS; i++) {
  bookTickets(store, {
    tierId: tier.id,
    quantity: 1,
    attendeeName: `Attendee ${i}`,
  });
}

// The same data as a plain array, so Array.find has the same job to do.
const bookingsArray = [...store.bookings.values()];

// Pick random references to look up. Both methods get the SAME list, so the
// comparison is fair.
const references = Array.from(
  { length: LOOKUPS },
  () => bookingsArray[Math.floor(Math.random() * bookingsArray.length)].reference,
);

// --- Timing ----------------------------------------------------------------------
function time(label, lookup) {
  const start = performance.now();
  let found = 0;
  for (const reference of references) {
    if (lookup(reference)) found++;
  }
  const ms = performance.now() - start;
  console.log(
    `${label.padEnd(12)} ${ms.toFixed(2).padStart(10)} ms  (${found}/${LOOKUPS} found)`,
  );
  return ms;
}

console.log(
  `\nLooking up ${LOOKUPS.toLocaleString()} bookings among ${BOOKINGS.toLocaleString()}:\n`,
);

time("warm-up", (ref) => findBookingByReference(store, ref)); // lets V8 optimise first
const mapMs = time("Map.get", (ref) => findBookingByReference(store, ref));
const arrayMs = time("Array.find", (ref) =>
  bookingsArray.find((booking) => booking.reference === ref),
);

console.log(`\nMap lookup was about ${(arrayMs / mapMs).toFixed(0)}x faster.`);
console.log(
  "Map.get is O(1): the reference is hashed straight to its slot.\n" +
    "Array.find is O(n): on average it checks half the list before finding a match.",
);