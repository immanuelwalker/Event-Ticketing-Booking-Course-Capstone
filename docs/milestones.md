# Milestones: Nine Builds

Each Build is one weekly session and ends with something I can run and show. A Build starts from the finished state of the one before it, so `main` must always stay working.

| Build | Week | Milestone | Stories |
|---|---|---|---|
| [1](build-1.md) | 4 | Domain core in the terminal | none (groundwork) |
| [2](build-2.md) | 5 | Event search, sorting, backlog, first tests | S02, S03, S04, S05, S06, S16 |
| [3](build-3.md) | 6 | Architecture, state machine, server skeleton | none (groundwork) |
| [4](build-4.md) | 7 | Working REST API (in memory) | S02, S03, S04, S05, S06, S07 |
| [5](build-5.md) | 8 | SQLite and the overselling fix | S08 |
| [6](build-6.md) | 9 | Frontend on mock data | S05, S06, S07 |
| [7](build-7.md) | 10 | Login, roles and a connected app | S01, S13, S02, S03, S04 |
| [8](build-8.md) | 11 | Refunds, waitlist, expiry, real test suite | S09, S10, S11, S12 |
| [9](build-9.md) | 12 | QR check-in, CI, security, demo-ready | S14, S15, S16 |

Each Build's file lists its deliverables, what I practise, when it is done, and its user stories with acceptance criteria.

## How the builds fit together

- **Rules first, then delivery.** The rules (events, tiers, booking, search) are built and tested in plain code first (Builds 1 and 2). They are then exposed through an API held in memory (Build 4), moved into SQLite (Build 5), and finally shown on screens (Builds 6 and 7).
- **Groundwork builds** (1 and 3) deliver no user stories. They set up the domain model, the architecture and the state machine that later builds depend on.
- **The three hard problems** each have a home: overselling in Build 5, and refunds and waitlists in Build 8.
- **Check-in and hardening** come last (Build 9): QR scanning, forged and repeated scan rejection, continuous integration and a security pass.

## Glossary

| Term | Meaning in this project |
|---|---|
| Build | One weekly session. It ends with something I can run and show. |
| Milestone | The one thing a Build must deliver. The table above lists all nine. |
| Sprint | A short, fixed period of work. Each Build is one sprint. |
| Backlog | Every story I might build, with its priority. It lives in [user-stories.md](user-stories.md). |
| User story | One sentence: "As a (who), I want to (what), so that (why)." |
| Acceptance criterion | A Given/When/Then sentence that says exactly when a story passes. |
| Test | Code that checks one acceptance criterion and fails if it is not met. |
| Definition of done | The checklist every story must pass before it is finished. |
| Pull request | A request to merge my `build-N` branch into `main`, so it can be reviewed first. |
| AI log | `docs/ai-log.md`. For each prompt: what I asked, what came back, and what was wrong. |
| Stable sort | A sort that keeps equal items in their original order. Example: two meetups on the same date stay in the order they were listed. |
| Pure function | Same input, same output, and nothing outside it changes. Example: a function that works out the total price of a booking. |
| State machine | A list of states and the only moves allowed between them. Example: a booking can go from pending to confirmed, but not from cancelled back to pending. |
| Idempotent | Doing it twice has the same effect as doing it once. Example: sending a cancel request twice must refund and release the seat only once. |

## Progress tracker

Tick each Build when its pull request is merged and its AI log entry is written.

- [ ] Build 1: Domain core in the terminal
- [ ] Build 2: Event search, sorting, backlog, first tests
- [ ] Build 3: Architecture, state machine, server skeleton
- [ ] Build 4: Working REST API (in memory)
- [ ] Build 5: SQLite and the overselling fix
- [ ] Build 6: Frontend on mock data
- [ ] Build 7: Login, roles and a connected app
- [ ] Build 8: Refunds, waitlist, expiry, real test suite
- [ ] Build 9: QR check-in, CI, security, demo-ready