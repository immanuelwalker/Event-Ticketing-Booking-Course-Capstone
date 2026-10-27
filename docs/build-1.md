# Build 1: Domain core in the terminal

*Week 4. Starts from an empty folder.*

**I deliver:** events, ticket tiers, bookings with a capacity rule, a first-in-first-out waitlist, and fast lookup of a booking by its reference code. It all runs in the terminal. There is no server and no database.

**I practise:** functions and objects, `Map`, a queue built as a linked list, Big O, errors, Git.

## Done when

- [ ] `npm run demo` prints the whole story: a tier sells out, a booking is refused, people join the waitlist, a booking is cancelled, and the next person in line is named.
- [ ] `npm run benchmark` shows a `Map` lookup far faster than `Array.find`, and I can explain why in Big O terms.
- [ ] My first pull request is merged.

## Stories in this build

None are finished here. This build creates the rules that S02, S03 and S06 depend on. Their criteria are written in [Build 2](build-2.md).

## Files I will end up with

| File | Purpose |
|---|---|
| `src/domain/errors.js` | `DomainError` with a machine-readable `code` |
| `src/domain/ids.js` | `newId()` and `newReference()`, using `node:crypto` |
| `src/domain/waitlistQueue.js` | FIFO queue as a linked list, with private fields |
| `src/domain/inventory.js` | The store and the rules: events, tiers, bookings, cancel, lookup, waitlist |
| `scripts/demo.js` | Tells the whole story in the terminal |
| `scripts/benchmark-lookup.js` | Times `Map.get` against `Array.find` |
| `test/*.test.js` | Early tests for the queue and the booking rules |

## Rules for this build

- Money is whole kobo, never decimals.
- Every input is validated, and a failure throws a `DomainError` with a code.
- A failed booking changes nothing.
- A booking is for 1 to 10 tickets from one tier.
- Cancelling twice is an error.
- References are found in O(1) using a `Map`.

## Questions I must be able to answer

1. Why is the queue's enqueue and dequeue O(1), when an array's `shift()` is O(n)?
2. Why is `Map.get` so much faster than `Array.find`?
3. What must happen to `tail` when the queue becomes empty, and what breaks if it doesn't?
4. Why must a failed booking leave the store unchanged?
5. Why use `node:crypto` instead of `Math.random` for IDs and references?

[All milestones](milestones.md) · [Build 2](build-2.md)