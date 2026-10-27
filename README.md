# DevsAssemble: Tech Meetups and Conferences Ticketing

**Organizers publish meetups and conferences. Attendees book seats. Staff check people in at the door with QR codes.**

DevsAssemble is a full-stack ticketing platform for the tech community: developer meetups, workshops, hackathons and multi-day conferences. It is my capstone project, built over nine weekly Build sessions with an AI coding tool as a partner. The app looks simple on the surface, but it hides three hard problems, and solving them well is the point of the project.


## The three hard problems

1. **Overselling.** A popular workshop has one seat left and fifty people press Book at the same moment. Exactly one of them must get it.
2. **Refunds.** When someone cancels, how much money goes back depends on how close the event is, and the seat must be released exactly once, even if the cancel request is sent twice.
3. **Waitlists.** When a sold-out workshop frees up a seat, the person who has waited longest is offered it for a limited time. If they do not take it, it passes to the next person.

These matter more for tech events than they might seem. Workshops have small hard capacities, conference early-bird tiers sell out in minutes, and people cancel late when a deadline hits at work.

## What I am building

| Role | What they can do |
|---|---|
| **Organizer** | Create, edit and publish events and ticket tiers. See bookings for their own events only. |
| **Attendee** | Browse and search events, book tickets, pay (mock payment), cancel and get a refund, join waitlists, see their own tickets. |
| **Staff** | Scan tickets at the door for events they are assigned to. Nothing else. |

The finished project has a website (HTML, CSS, JavaScript), a JavaScript API, and a database. Payments are simulated: no real money moves.

## Example events

These sample events also serve as test data. All prices are in kobo (100 kobo = 1 naira) and stored as whole numbers.

| Event | City | Format | Tiers (price in kobo, capacity) |
|---|---|---|---|
| Lagos JavaScript Meetup | Lagos | Evening meetup | Free RSVP (0, 150), Supporter (500000, 30) |
| Intro to SQL Workshop | Abuja | Half-day hands-on workshop | Student (1500000, 15), Standard (2500000, 15) |
| West Africa DevCon | Lagos | Two-day conference | Early Bird (2000000, 100), Standard (3500000, 300), Workshop Add-on (1000000, 40) |
| Women in Tech Hackathon | Ibadan | Weekend hackathon | Participant (500000, 80), Mentor (0, 20) |

## How the course works

Every Build session has four steps:

1. **Gap lesson.** Learn the things I have not been taught yet but need for this build.
2. **Prompt and build.** Give the AI tool a clear description of the milestone and the rules, and let it write a first draft.
3. **Review.** Read the code, run it, and decide what is wrong. Fix it, and tell the AI why it was wrong.
4. **Ship.** Commit on a branch named `build-N`, open a pull request into `main`, and merge it.

**The AI writing the code is not the skill being graded.** The skill is knowing what to ask for, and knowing whether what came back is correct.

### The AI log

`docs/ai-log.md` records every important prompt:

- what I asked,
- what came back,
- what was wrong with it (or "nothing"), and what I changed.

There is at least one entry in every build.

## Stack

- **Frontend:** HTML, CSS, JavaScript (no framework)
- **Backend:** Node.js 22.13 or newer, JavaScript API
- **Database:** SQLite
- **Tests:** Node's built-in test runner
- No outside packages are needed. Check your Node version with `node --version`.

## Documents

- [docs/milestones.md](docs/milestones.md): the nine builds, what each delivers, and the glossary.
- [docs/user-stories.md](docs/user-stories.md): the product backlog and the definition of done.
- [docs/ai-log.md](docs/ai-log.md): the log of AI prompts and what I corrected.
- `docs/build-1.md` to `docs/build-9.md`: the detail for each build (deliverables, what I practise, when it is done, acceptance criteria).

## Getting started

```bash
git clone https://github.com/YOUR-USERNAME/devassembles.git
cd devsassemble
node --version   # must be 22.13 or newer
```

## Running it

```bash
npm run demo        # a tier sells out, a booking is refused, the waitlist, a cancellation
npm run benchmark   # Map lookup versus Array.find
npm test            # every automated test (fails if any test fails)
```

Setup instructions for the full web app will be added as the builds progress.

## Rules of the road

- Work on a branch called `build-N`, open a pull request, merge to `main`. Never push straight to `main` after the first commit.
- Never commit secrets, passwords or `.env` files.
- Money is stored as whole numbers of the smallest unit (kobo), never as decimals.
- I am responsible for every line of this project, including the lines the AI wrote.