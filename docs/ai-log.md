# AI Log

One entry per important prompt. For each: what I asked, what came back, what was wrong (or "nothing"), and what I changed. At least one entry per Build.

Write entries **as they happen**, not at the end.

---

## Build 1: Domain core

**Tool used:** Claude (chat)

**What I asked:**
I gave the AI the Build 1 brief and asked for a DevsAssemble domain core: errors, ids, a linked-list waitlist queue, inventory rules, a demo script and a benchmark. Money in kobo, tech-meetup sample data.

**What came back:**
Files: `errors.js`, `ids.js`, `waitlistQueue.js`, `inventory.js`, `demo.js`, `benchmark-lookup.js`, plus two test files and `package.json`.

**What was wrong:**

What I checked:
Quantity
- Rejected: 0, -1, 11, 2.5, "3", NaN, Infinity, null, undefined, [2], {}, true
- Accepted: whole numbers from 1 to 10

Attendee name
- Rejected: empty, spaces only, a number, null, undefined, an object, an array

IDs
- Booking with an unknown, empty, null, undefined or numeric tier id gives NOT_FOUND
- Adding a tier to an unknown event gives NOT_FOUND

Tier price and capacity
- Price rejected: 10.5, -1, "500", NaN, Infinity, null, undefined
- Capacity rejected: 0, -1, 2.5, "10", Infinity, NaN, 1e21, null, undefined
- A blank tier name is rejected

Event fields and dates
- Rejected: empty title, null city, undefined venue, a numeric title
- Dates rejected: "not a date", 2026-02-30, 2027-02-29, 2026-13-01, 12/05/2026,
  a time with no offset, a number, null

Failed bookings
- After 5 failed bookings (too many seats, quantity 0, blank name, unknown tier,
  quantity 11), seats left and the booking count were unchanged

Cancelling
- Works with a lowercase reference
- Cancelling twice gives ALREADY_CANCELLED and does not release seats a second time
- Unknown, empty, null, undefined, numeric and object references give NOT_FOUND
- Looking up a null reference returns null without crashing

Queue
- dequeue and peek on an empty queue return undefined without crashing
- Enqueue after emptying the queue still works (the tail reset)
- 100,000 items come out in first-in-first-out order
- head and tail cannot be reached from outside the class

Waitlist
- Joining while seats remain gives NOT_SOLD_OUT
- The same person twice is rejected, even with different capitals or extra spaces
- A blank name gives VALIDATION
- An unknown tier gives NOT_FOUND

Copies
- Editing a returned booking does not change the stored booking
- Editing a returned event's tierIds does not change the store

References
- 10,000 references all match the XXXX-XXXX shape
- None contain 0, O, 1, I or L
- All 10,000 were different

Missing arguments
- Calling functions with no second argument (see problems 1 to 5 above)

Limits
- A huge price times 10 tickets, a 1,000,000-character name, and control
  characters in a name (see problems 2 to 4 above)


**Decisions the AI made that I had to approve or change:**
- Waitlist can only be joined when the tier is sold out (code `NOT_SOLD_OUT`).
- The same person cannot join one waitlist twice (code `ALREADY_WAITLISTED`).
- `cancelBooking` only *names* the next person in line. It does not remove them or give them a seat. That arrives in Build 8.
- Bookings have status `confirmed` or `cancelled`. Payment states arrive in Build 4.
- Lookup returns `null` for "not found", while cancel throws `NOT_FOUND`.
- Returned objects are copies so outside code cannot corrupt the store.

**What I changed / what I told the AI:**

First prompt: the course Build 1 prompt, with this context added at the top: "This is
DevGather, a ticketing platform for tech meetups. Money is whole kobo, never decimals.
Use sample data like the Intro to SQL Workshop."

After my review (`npm run probe`), I gave the AI these follow-ups:

1. "Calling `bookTickets(store)` with no second argument crashes with a raw TypeError.
   Every public function must throw a `DomainError` with code VALIDATION for missing or
   wrong input, never a TypeError. Give the object parameters a default of `{}` and add
   a test for each function."
2. "A price of Number.MAX_SAFE_INTEGER times 10 tickets gives a total beyond the safe
   integer range. Add a maximum price per ticket so totalKobo is always a safe integer,
   and test the boundary."
3. "Attendee names have no maximum length and accept newlines and control characters.
   Limit names to 100 characters and reject control characters, with tests."

What I changed myself or approved:
- Added a test for the queue's tail reset (enqueue after emptying), because that is the
  most common linked-list bug.
- Decided to leave queue jumping for Build 8. Build 1 only has to name the next person,
  and S12 needs seats held for the waitlist.
- Approved these decisions: the waitlist is only open when a tier is sold out, the same
  person can't join twice, and cancelling names the next person without giving them the
  seat.

Fixed later in Build 2: 30 February being accepted, shallow copies leaking `tierIds`,
and draft events being bookable.

Status: [fixed on <date> / not yet fixed] for items 1 to 4.

**What I learned:**

- `Map.get` finds a booking by reference in one step because it hashes the key straight
  to its slot (O(1)). `Array.find` checks items one by one, about half of them on
  average (O(n)). With 100,000 bookings the benchmark showed the Map was over 100 times
  faster, and the gap grows as the list grows.
- A linked-list queue is O(1) at both ends because it keeps a pointer to the head and
  the tail. `array.shift()` is O(n) because it slides every other item along. When the
  last item leaves, `tail` must be reset to null, or the next person added silently
  disappears.
- Validate everything first, then change the store. That is how a failed booking leaves
  nothing half-done.
- Return copies, not the real objects. A shallow copy still shares inner arrays, so
  outside code could change the store without going through the rules.
- Checking error codes is more reliable than reading error messages, because wording can
  change.
- The AI's code passed its own demo, but my review found gaps it never mentioned:
  missing arguments, money overflow, unlimited names, and impossible dates. A working
  demo is not the same as correct code.

---

## Build 2: Search, sorting, publishing, first tests

**Tool used:** Claude (chat)

**What I asked:**
I gave the AI the Build 2 brief (stories S02 to S06 and S16, plus the course prompt) and asked it to add a hand-written merge sort, publish and unpublish, event summaries, pure search/filter/sort functions, and tests for every acceptance criterion. I told it money is kobo, so `maxPriceCents` became `maxPriceKobo`.

**What came back:**
`dates.js`, `sorting.js`, `eventSearch.js`, changes to `inventory.js` and `errors.js`, three new test files, and edits to the Build 1 tests and scripts. 89 tests passing.

**What was wrong or had to change:**
- **A Build 1 bug, found while checking S02.** `createEvent` validated dates with `new Date(value)`, which accepts `2026-02-30` (it silently becomes 2 March). S02 requires "a date that is not a real date" to be rejected. Fixed with a strict parser in `dates.js`.
- **The brief contradicted Build 1.** S06 says a booking starts `pending`, but Build 1 used `confirmed`. Changed it, and updated the old tests on purpose.
- **S06 says "a published event", but Build 1 let you book a draft.** Added `INVALID_STATE` for that, which broke 12 old tests until their setup published the event first.
- **Shallow copies leaked.** The `copy()` helper used `{...object}`, which shares nested arrays, so a caller could edit an event's `tierIds`. Replaced with `structuredClone`.
- **The brief uses cents.** This project uses kobo.
> Add your OWN review findings here. What did you try to break? What did you find that I did not?

**Decisions I had to approve:** see "Rules I decided on" in `docs/build-2.md`.

**How I checked the tests really work:**
I sabotaged the code four ways (broke stability, used the built-in sort, shortened the `to` date, allowed 30 February) and confirmed a test failed each time. I also confirmed `npm test` exits with code 1 when a test fails.

**What I learned:**

- **Merge sort is O(n log n).** The list can be halved about log n times, and each level
  of merging touches every item once (the n). For 1,000,000 events that is roughly 20
  million steps, versus a trillion for a simple compare-everything sort.
- **Merge sort is stable because of one choice in `merge`:** on a tie it takes from the
  left piece. Left items started earlier in the list, so equal items keep their original
  order. Changing `<= 0` to `< 0` broke the stability test, which I tried on purpose.
- **A pure function** gives the same output for the same input and changes nothing
  outside itself. That is why `filterEvents` and `sortEvents` are easy to test: put a
  list in and check the list that comes out.
- **Freezing test data proves a function doesn't mutate it.** If the code tried to change
  a frozen list, JavaScript would throw an error and the test would fail.
- **`new Date("2026-02-30")` is dangerous for business rules** because it silently becomes
  2 March. Real validation needs a strict parser that checks the date exists.
- **Writing the acceptance criteria first gave me the tests.** Each Given/When/Then
  sentence became one test, named after its story (for example "S05: ..."), so I can trace
  every rule to proof.
- **A passing test only means something if it can fail.** I broke the code four ways
  (stability, the built-in sort, the `to` date, impossible dates) and each time the right
  test failed. `npm test` also exits with code 1 when a test fails, which is what S16 asks
  for.
- **The AI contradicted its own earlier work.** Build 1 used `confirmed` and allowed
  booking drafts, but the Build 2 stories said otherwise. Reading the stories against the
  code caught it, and I had to decide which was right.

---