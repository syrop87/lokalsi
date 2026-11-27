---
project: Lokalsi
version: 1
status: draft
created: 2026-11-20
updated: 2026-11-27
prd_version: 1
main_goal: speed
top_blocker: time
milestone_id: first-joinable-event
milestone_seq: 1
milestone_status: open
---

# Roadmap: Lokalsi

> Derived from `context/foundation/prd.md` (v1) + auto-researched codebase baseline.
> Edit-in-place; the next milestone continues this file. Archive only when an independent roadmap replaces it.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Milestone

**M-01: First joinable event** — Status: open

- **Intent:** A newcomer who logs in can see a neighbour's event on the map, join it, and the author can see them; hobby-matching and cancellation complete the PRD's must-have set.
- **Source materials:** `context/foundation/prd.md` (v1)
- **Done when:** every F-NN and S-NN below is `done`.
- **Scope anchors:** FR-001 – FR-010, FR-013 – FR-015 (all must-have); US-01. Nice-to-have FR-011 and FR-012 are parked.

## Vision recap

A person new to an area has no way to reach neighbours they don't know yet, so they play basketball alone on an empty court. Lokalsi is a map of one neighbourhood with pinned, dated hobby events that neighbours post and join. v1 is login-only, Polish-only and phone-friendly, and serves about a hundred local users.

## North star

**S-05: Newcomer joins a neighbour's event and the author sees them** — this is the north star: the smallest end-to-end flow that proves the product works, placed as early as its prerequisites allow. It is the primary success criterion, and with the speed goal everything else only matters if it works.

## At a glance

| ID   | Change ID                  | Outcome (user can …)                                                        | Prerequisites | PRD refs                | Status   |
| ---- | -------------------------- | --------------------------------------------------------------------------- | ------------- | ----------------------- | -------- |
| F-01 | rls-verification-baseline  | (foundation) author-only data access rules proven on a first table          | —             | Access Control, FR-007  | done     |
| S-01 | login-wall-polish          | sign up, stay logged in, log out, and see nothing without login, in Polish  | —             | FR-001, FR-002          | ready    |
| S-03 | post-event-on-map          | post an event with a map pin and see it on the neighbourhood map            | S-01, F-01    | FR-004, FR-006, FR-014  | blocked  |
| S-04 | event-details              | open a pin and see the event's details and who created it                   | S-03          | FR-005, US-01           | proposed |
| S-05 | join-event                 | join and leave a neighbour's event and see who has joined                   | S-04          | FR-008, FR-009, FR-010, US-01 | proposed |
| S-02 | profile-hobbies            | write a self-description and choose hobbies in my profile                   | S-01, F-01    | FR-003, FR-013          | blocked  |
| S-06 | recommended-pins           | see events matching my hobbies as distinct pins on the map                  | S-02, S-03    | FR-015, US-01           | proposed |
| S-07 | cancel-event-with-message  | cancel my own event with a message that joiners still see until its date    | S-05          | FR-007, US-01           | proposed |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below.

| Stream | Theme                 | Chain                                            | Note                                                              |
| ------ | --------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| A      | Event loop            | `F-01` → `S-03` → `S-04` → `S-05` → `S-07`        | The north-star path; speed goal puts it first.                    |
| B      | Login wall            | `S-01`                                           | Standalone; unblocks S-03 and S-02, can run in parallel with F-01. |
| C      | Hobbies and matching  | `S-02` → `S-06`                                  | Joins Stream A at `S-03` (S-06 needs events on the map).          |

## Baseline

What's already in place in the codebase as of 2026-11-20 (auto-researched + user-confirmed).

- **Frontend:** partial — pages, UI components and auth pages exist; no map, no Polish interface text.
- **Backend / API:** partial — only sign-in/sign-up/sign-out routes under `src/pages/api/auth/`.
- **Data:** absent — no migrations or tables, only `supabase/config.toml`.
- **Auth:** present — sign-in/up/out and session middleware (`src/middleware.ts`); only `/dashboard` is protected, not the whole site.
- **Deploy / infra:** present — Worker live at `https://lokalsi.pborys.workers.dev`, CI workflow in `.github/workflows/ci.yml`, deploy plan executed 2026-11-20.
- **Observability:** absent — parked for v1 (see Parked).

## Foundations

### F-01: RLS verification baseline

- **Outcome:** (foundation) a migration workflow is proven against the hosted database, and a repeatable two-user check shows that only an author can change their own row.
- **Change ID:** rls-verification-baseline
- **PRD refs:** Access Control, FR-007 (only the author changes an event), guardrail "only the author can change an event"
- **Unlocks:** S-03 and S-02 (first tables land through this workflow); the verification path S-07 uses to prove no one cancels another user's event.
- **Prerequisites:** —
- **Parallel with:** S-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Data is absent and per-role access rules are easy to get wrong when new to the tooling; proving the pattern once keeps later slices from each inventing it. It deliberately stops at the pattern and the check — the real tables arrive with S-02 and S-03.
- **Status:** done

## Slices

### S-01: Login wall in Polish

- **Outcome:** user can sign up, stay logged in across visits, log out, and sees nothing but sign-up/login until logged in, with interface text in Polish.
- **Change ID:** login-wall-polish
- **PRD refs:** FR-001, FR-002
- **Prerequisites:** —
- **Parallel with:** F-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Auth already exists, so this is mostly gating the whole site and Polish text; sequenced first because every later slice assumes a logged-in user.
- **Status:** ready

### S-03: Post an event and see it on the map

- **Outcome:** user can post an event with title, description, date/time, tags and a pin on the neighbourhood map, and see upcoming events as pins.
- **Change ID:** post-event-on-map
- **PRD refs:** FR-004, FR-006, FR-014
- **Prerequisites:** S-01, F-01
- **Parallel with:** S-02
- **Blockers:** —
- **Unknowns:**
  - Which neighbourhood does v1 serve (sets the map area)? — Owner: user. Block: yes.
  - What is on the fixed tag list? — Owner: user. Block: yes.
  - Which map provider? — Owner: user. Block: no.
- **Risk:** The map is the costliest piece for a first web project, so it goes in the first event slice; it surfaces the biggest learning cost early.
- **Status:** blocked

### S-04: See event details

- **Outcome:** user can open a pin and see the event's details, including who created it.
- **Change ID:** event-details
- **PRD refs:** FR-005, US-01
- **Prerequisites:** S-03
- **Parallel with:** S-02
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Thin slice on top of S-03; split out so the map slice stays one primary action.
- **Status:** proposed

### S-05: Join an event

- **Outcome:** user can join and leave a neighbour's event, the author is automatically a participant, and everyone logged in sees participants by name with their self-description.
- **Change ID:** join-event
- **PRD refs:** FR-008, FR-009, FR-010, US-01
- **Prerequisites:** S-04
- **Parallel with:** S-02
- **Blockers:** —
- **Unknowns:** —
- **Risk:** This is the north-star slice; it needs a second user to demonstrate, so verification requires two test accounts.
- **Status:** proposed

### S-02: Profile and hobbies

- **Outcome:** user can write a short self-description and choose hobbies from the fixed tag list in their profile.
- **Change ID:** profile-hobbies
- **PRD refs:** FR-003, FR-013
- **Prerequisites:** S-01, F-01
- **Parallel with:** S-03, S-04, S-05
- **Blockers:** —
- **Unknowns:**
  - What is on the fixed tag list? — Owner: user. Block: yes.
- **Risk:** Off the north-star path, so sequenced after it; the participant list in S-05 shows names only until this lands.
- **Status:** blocked

### S-06: Recommended pins

- **Outcome:** user can see events matching one of their hobbies as distinct pins on the map.
- **Change ID:** recommended-pins
- **PRD refs:** FR-015, US-01
- **Prerequisites:** S-02, S-03
- **Parallel with:** S-05, S-07
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Depends on both hobbies and events; it is the domain rule of the product, so it must land before the milestone closes.
- **Status:** proposed

### S-07: Cancel an event with a message

- **Outcome:** user (as author) can cancel their own event with a message; others no longer see it, and those who joined see it marked cancelled with the message until its date passes.
- **Change ID:** cancel-event-with-message
- **PRD refs:** FR-007, US-01
- **Prerequisites:** S-05
- **Parallel with:** S-02, S-06
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Touches both visibility and the author-only rule; uses F-01's two-user check to prove nobody else can cancel.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID                 | Suggested issue title                                   | Ready for `/10x-plan` | Notes                                      |
| ---------- | ------------------------- | ------------------------------------------------------- | --------------------- | ------------------------------------------ |
| F-01       | rls-verification-baseline | Prove migrations and author-only access rules           | yes                   | Run `/10x-plan rls-verification-baseline`  |
| S-01       | login-wall-polish         | Whole-site login wall with Polish interface             | yes                   | Run `/10x-plan login-wall-polish`          |
| S-03       | post-event-on-map         | Post an event with a map pin                            | no                    | Resolve neighbourhood and tag list first   |
| S-04       | event-details             | Event details with creator                              | no                    | Needs S-03                                 |
| S-05       | join-event                | Join/leave an event and list participants               | no                    | Needs S-04                                 |
| S-02       | profile-hobbies           | Profile self-description and hobbies                    | no                    | Resolve tag list first                     |
| S-06       | recommended-pins          | Distinct pins for hobby-matching events                 | no                    | Needs S-02, S-03                           |
| S-07       | cancel-event-with-message | Author cancels event with a message                     | no                    | Needs S-05                                 |

## Open Roadmap Questions

1. **Which specific neighbourhood does the first version serve?** — Owner: user. Block: S-03.
2. **What exactly is on the fixed list of tags?** — Owner: user. Block: S-02, S-03.
3. **Within how many days is a user's account and data removed on request?** 30 days was offered as an example. — Owner: user. Block: roadmap-wide (no slice implements removal; admin does it by hand in v1).
4. **Are chat or comments on events wanted later?** — Owner: user. Block: none (v1 not affected).
5. **What are the expected request volume and data volume?** Only `users: medium` was captured. — Owner: user. Block: none.
6. **Which map provider?** — Owner: user. Block: S-03 planning (decision, not blocking).

## Parked

- **FR-011 participant limit** — Why parked: nice-to-have; speed goal and a tight after-hours budget.
- **FR-012 email notice on cancellation** — Why parked: nice-to-have, split out of FR-007 to fit the budget.
- **Observability baseline** — Why parked: absent today, not required by the PRD; speed goal.
- **People-based recommendations, requests for help, event editing, more than one neighbourhood, admin screens, account recovery and email verification, recurring events, visitor mode, ranking, offline use, native app, second language** — Why parked: PRD §Non-Goals.

## Milestone History

## Done

- **F-01: (foundation) a migration workflow is proven against the hosted database, and a repeatable two-user check shows that only an author can change their own row** — Archived 2026-11-27 → `context/archive/2026-11-20-rls-verification-baseline/`. Lesson: —. Note: archived with hosted-project proof (plan rows 3.3–3.6: `supabase db push`, hosted `rls-check`, test-user cleanup, anon REST check) not ticked; see the archived `runbook.md`.
