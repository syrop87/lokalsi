---
project: "Lokalsi"
context_type: greenfield
created: 2026-10-10
updated: 2026-10-23
product_type: web-app
target_scale:
  users: medium
timeline_budget:
  mvp_weeks: 10
  hard_deadline: 2027-01-10
  after_hours_only: true
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: "pain category"
      decision: "missing capability — no channel for reaching neighbours you don't know yet"
    - topic: "insight"
      decision: "existing neighbourhood groups are not place-and-time shaped"
    - topic: "primary persona"
      decision: "newcomer primary; long-time residents secondary (everyone can use the app)"
    - topic: "geographic scope"
      decision: "one specific neighbourhood for the first version"
    - topic: "help requests"
      decision: "hobby meetups are the core; help requests secondary (later resolved: not in v1 — see 'help requests in v1')"
    - topic: "sign-in method"
      decision: "email and password; open sign-up with no residency check"
    - topic: "visitor visibility"
      decision: "originally: map visible to visitors, details hidden until login; superseded by 'MVP size' — no visitor mode in v1"
    - topic: "roles"
      decision: "flat users plus a single admin (the builder) who can remove any event or user"
    - topic: "MVP size"
      decision: "scoped down: no admin screens, no password reset or email verification, no visitor mode (whole site requires login); event editing kept at that point, later dropped — see 'edit vs delete'"
    - topic: "participant limit"
      decision: "optional limit set by the author; nice-to-have, outside the MVP"
    - topic: "help requests in v1"
      decision: "not in v1; one kind of event (activity)"
    - topic: "participant list visibility"
      decision: "visible to every logged-in user"
    - topic: "edit vs delete"
      decision: "no event editing; author deletes with a message shown in the app to everyone who joined (email delivery later demoted to nice-to-have — see 'budget after additions')"
    - topic: "self-description"
      decision: "part of the user profile, visible to others and shown in participant lists; must-have"
    - topic: "domain rule"
      decision: "hobby-tag matching only; people-based recommendation ruled out for v1"
    - topic: "tags"
      decision: "fixed list plus 'other'; several tags per event, several hobbies per user; any match recommends"
    - topic: "budget after additions"
      decision: "keep 10 weeks; email notification on deletion demoted to nice-to-have"
    - topic: "product framing"
      decision: "website; dozens to a hundred users; after-hours work; hard deadline 2027-01-10"
    - topic: "non-goals"
      decision: "12 non-goals recorded; chat or comments deliberately not ruled out"
    - topic: "cancel semantics"
      decision: "removing an event is a cancel: hidden from everyone else, shown as cancelled with the message to those who joined until its original date"
    - topic: "'other' tag"
      decision: "available for events only, not as a hobby; never produces a recommendation"
    - topic: "primary success criterion"
      decision: "includes the recommendation rule: hobbies set, matching event marked, joined, author sees the participant"
    - topic: "participant limit counting"
      decision: "the author counts toward the limit"
    - topic: "timeline"
      decision: "10 weeks at ~3 h/week; sustained-effort cost acknowledged 2026-10-10"
    - topic: "interface language"
      decision: "Polish only, including the tag list and date/time formats (added 2026-10-23)"
  frs_drafted: 15
  quality_check_status: accepted
---

## Seed idea

> Lokalsi: a website with a map of the neighbourhood where logged-in users post events (activities or requests for help) with a pin
> and date-time, and others can join. Builder is a Python data scientist new to web development, with ~3 h/week until 10 Jan 2027.
> Proposed MVP: event create/edit/delete by author, join/leave, past events hidden. Open questions: which stack (how far from
> Python to go), which map provider, whether events need a participant limit, how to handle misuse of public posts.

## Vision & Problem Statement

A person who is new in the area tries to find a way to meet the neighbours, ideally the ones sharing their hobbies. They visit the nearby basketball court but never meet anybody there — it looks like people play at other hours — so they play alone. The pain is a missing capability: there is no channel for reaching neighbours they don't know yet.

Insight: existing neighbourhood groups are not place-and-time shaped. A map of the neighbourhood with pinned, dated events is.

Scope notes:
- The first version serves one specific neighbourhood.
- Hobby meetups (activities) are the core. Requests for help are secondary and are not in v1.
- As many local people as possible need to be in the app, so that there are events to see and people to join them.
- At 100 times the expected number of users the hobby-matching rule would produce too many matches and would need ranking; v1 does not rank.

## User & Persona

Primary persona: a newcomer — someone who recently moved into the area and wants to meet neighbours, ideally ones sharing their hobbies. The moment they reach for the product: they went to the local basketball court, found it empty, and played alone.

### Secondary persona

Long-time residents. They can see and join events, and can themselves feel the need to meet new people in the area. Everyone living locally can use the app; the newcomer's experience wins when design choices conflict.

## Success Criteria

MVP flow:

1. The newcomer opens the site and signs up or logs in, and sets their hobbies in their profile.
2. They land on the map of their neighbourhood and see pins for upcoming events posted by other local users; events matching their hobbies have a distinct pin.
3. They click a pin that looks interesting and see the details, including who created it.
4. They click "join".
5. The author — a different user who created the event earlier — sees who has joined.

### Primary
- A newcomer sets hobbies in their profile, sees a matching event marked as recommended on the map, joins it, and the author — another user — sees them among the participants.

### Secondary
- The newcomer also posts their own event, and others join it.

### Guardrails
- Only the author can change an event: no user can cancel someone else's event. (The admin removing an abusive event by hand is the one exception.)
- Usable on a phone: the map and the join action work in a phone browser.

## User Stories

### US-01: Newcomer joins an event posted by a neighbour

- **Given** a logged-in newcomer, and an upcoming event created by another local user
- **When** they open the neighbourhood map, click the event's pin, and click "join"
- **Then** they are listed among the event's participants, and the author sees them there

#### Acceptance Criteria
- The map shows only upcoming events; past events are hidden
- The event details show who created the event
- The list of participants is visible to every logged-in user, each shown by name with the self-description from their profile
- The author is listed among the participants of their own event
- The newcomer can leave the event again
- If the author cancels the event, the newcomer still sees it marked as cancelled, with the author's message, until its original date passes
- An event with a tag matching one of the newcomer's hobbies is shown with a distinct pin

## Functional Requirements

Numbering note: renumbered after the challenge round. "Author can edit their own event" was removed, and the self-description requirement was added as FR-003.

### Accounts
- FR-001: Visitor can sign up with email and password. Priority: must-have
  > Socrates: Counter-argument considered: "unverified emails invite fake accounts."
  > Resolution: kept; the risk is accepted in v1, fake accounts are removed by hand,
  > and email verification stays deferred.
- FR-002: User can log in, stay logged in across visits on the same device, and log out. Priority: must-have
  > Socrates: Counter-argument considered: "frequent re-login kills casual use."
  > Resolution: reworded to promise that the user stays logged in across visits.
- FR-003: User can write a short self-description in their profile, visible to other users. Priority: must-have
  > Socrates: Added during the challenge of the event-details requirement ("a bare
  > name tells a newcomer nothing"). No counter-argument selected; user clarified that
  > the self-description is part of the user profile visible to others, not something
  > entered separately for each event.

### Map and events
- FR-004: User can see a map of the neighbourhood with pins for upcoming events. Priority: must-have
  > Socrates: Counter-argument considered: "the map is the most expensive piece for
  > a first web project." Resolution: kept as must-have; the learning cost is accepted.
- FR-005: User can open an event to see its details, including who created it. Priority: must-have
  > Socrates: Counter-argument considered: "a bare name tells a newcomer nothing."
  > Resolution: kept; a short self-description was added as its own must-have (FR-003).
- FR-006: User can create an event with a title, a description, a pin on the map and a date and time. Priority: must-have
  > Socrates: Counter-argument considered: "a pin and a time don't say what it is."
  > Resolution: reworded to include a title and a description.
- FR-007: Author can cancel their own event with a message; the event disappears for everyone else, and users who joined still see it marked as cancelled, with that message, until its original date passes. Priority: must-have
  > Socrates: Counter-arguments considered: "silent edits and silent deletion strand
  > people who joined." Resolution (user's proposal): editing is dropped entirely;
  > deletion carries the author's message (e.g. "sorry, I need to reschedule the game
  > to 2:30 next day — I will create a new event, feel free to join") and is emailed
  > to everyone who joined. Accepted costs: sending email returns to v1, unverified
  > addresses may not receive the notice, and small fixes require delete and re-post.
  > Revised in Phase 5 (budget): the message shown in the app is must-have; the email
  > delivery was split out as nice-to-have (FR-012).
  > Clarified in the consistency review: this is a cancel, not a delete — the event
  > stays visible to those who joined until its original date passes.

### Participation
- FR-008: User can join an event created by another user; the author is automatically listed as a participant of their own event. Priority: must-have
  > Socrates: Counter-argument considered: "the author should count as attending."
  > Resolution: reworded so the author is automatically a participant.
- FR-009: User can leave an event they joined; the author cannot leave their own event. Priority: must-have
  > Socrates: Counter-argument considered: "the author can't leave their own event."
  > Resolution: reworded; the author's only way out is cancelling the event with a
  > message (FR-007).
- FR-010: User can see who has joined an event, each participant shown by name with the self-description from their profile. Priority: must-have
  > Socrates: Counter-argument considered: "names alone say little." Resolution:
  > reworded so the list shows the self-description, taken from the user profile
  > rather than entered per event.
- FR-011: Author can set an optional participant limit on their event; the author counts toward the limit. Priority: nice-to-have
  > Socrates: No counter-argument; it stands as written.
- FR-012: User who joined an event is notified by email, with the author's message, when the author cancels it. Priority: nice-to-have
  > Socrates: Split out of FR-007 in Phase 5 to keep the 10-week budget; not
  > challenged separately.

### Recommendations
- FR-013: User can list several hobbies in their profile, chosen from a fixed list of tags (without "other"). Priority: must-have
  > Socrates: Added in Phase 5 as part of the domain rule; not challenged separately.
- FR-014: Author can give an event one or more tags from the same fixed list, plus "other". Priority: must-have
  > Socrates: Added in Phase 5 as part of the domain rule; not challenged separately.
- FR-015: User can see recommended events — those with a tag matching one of their hobbies — marked on the map with a distinct pin. Priority: must-have
  > Socrates: Added in Phase 5 as part of the domain rule; not challenged separately.

## Non-Functional Requirements

- Every step of the main flow (sign up, see the map, open an event, join) is completable on a phone screen in the two mainstream mobile browsers.
- No user's email address is ever visible to another user; other users see only the name and the profile self-description.
- A user who asks to leave has their account and data removed on request, within 30 days. (The 30-day figure was an example offered during shaping; to be confirmed — see Open Questions.)
- Past events and their participant lists are kept indefinitely after they disappear from the map, except for the data of a user who asks to be removed.
- All interface text, the tag list, and dates and times are shown in Polish, in Polish formats.

## Business Logic

Lokalsi marks an upcoming event as recommended for a user when one of the event's tags matches a hobby in that user's profile.

Inputs: the tags an author gives an event, and the hobbies a user lists in their profile. Both are chosen from the same fixed, broad list (e.g. basketball, birdwatching). An event can carry several tags and a user can list several hobbies; a single match is enough. Events can additionally be tagged "other" for activities missing from the list; "other" is not available as a hobby, so it never produces a recommendation.

Output: for each user, every upcoming event is either recommended or not.

How the user encounters it: on the neighbourhood map, recommended events appear with a distinct pin, so a newcomer sees at a glance which events are about their hobbies.

Supporting rules stated during shaping:
- Past events are hidden; the map shows only upcoming events.
- The author is automatically a participant of their own event and cannot leave it.
- An author cancels an event with a message; the event disappears for everyone else, and the people who joined see it marked as cancelled, with the message, until its original date passes.

## Access Control

- Sign-in: email and password. Sign-up is open — anyone can register; there is no residency check. The neighbourhood focus comes from the map area.
- Unauthenticated visitor (v1): sees nothing but sign-up / login — the whole site requires login. The originally chosen visitor mode (map visible, event details hidden until login) was cut from v1 during MVP scoping and is deferred.
- Roles: flat user model plus a single admin (the builder). In v1 the admin has no screens in the site; removing an abusive event or user is done by hand behind the scenes.
- No password reset and no email verification in v1.

| Capability | Visitor | User | Admin (by hand, outside the site in v1) |
|---|---|---|---|
| See the map with event pins | no | yes | yes |
| See event details | no | yes | yes |
| Create an event | no | yes | yes |
| Cancel an event (no editing in v1) | no | own events only | any event (removal for misuse) |
| Join / leave an event | no | yes (author cannot leave their own) | yes |
| See who has joined an event | no | yes | yes |
| Write own profile self-description and hobbies | no | yes | yes |
| Remove a user | no | no | yes |

## Non-Goals

Functional:
- No people-based recommendations — no marking users as liked, no "someone you like is going"; a newcomer has nobody to mark yet.
- No requests for help — v1 has one kind of event, an activity; hobby meetups are the core.
- No event editing — the author cancels with a message and posts a new event.
- No more than one neighbourhood — the map covers a single area.
- No admin screens or reporting — misuse is handled by the builder by hand.
- No account recovery or email verification — no password reset and no email confirmation at sign-up; cut to fit the budget.
- No recurring events — every event is a single date and time.
- No visitor mode — nothing is visible without logging in; the "map visible, details hidden" mode is deferred.

Non-functional:
- No ranking of recommendations — an event is either recommended or not.
- No offline use — the site needs a connection.
- No native mobile app — a website usable in a phone browser only.
- No second language — the interface is in Polish only.

Considered and deliberately not ruled out: chat or comments on events (not in the requirements either; left open).

## Timeline acknowledgment

Budget: 10 weeks at about 3 hours per week (about 30 hours), against a deadline of 10 January 2027 (13 weeks from 2026-10-10; 3 weeks of buffer).

Acknowledged on 2026-10-10: 10-week MVP requires sustained dedication; user accepted.

Scope-down decisions for v1:
- Cut: admin screens, password reset, email verification, visitor mode.
- Later changes (challenge round): event editing dropped; deletion with an emailed message to participants added; profile self-description added.
- Phase 5: hobby-tag recommendations added as must-have. To keep the 10-week budget, the email notification on deletion was demoted to nice-to-have (the message shown in the app stays must-have).

## Forward: tech-stack

Informational; not part of the PRD. For the stack-selection step.

- The builder is a Python data scientist, new to web development, with about 3 hours per week.
- Open question from the seed: which stack — how far from Python to go.
- Open question from the seed: which map provider.
- v1 has no email sending among its must-haves; email notification on event cancellation (FR-012) is a nice-to-have, and email verification and password reset are deferred.

## Open Questions

1. Which specific neighbourhood does the first version serve? — Owner: user.
2. ~~Do requests for help make the MVP, or only activities?~~ — Resolved 2026-10-10: not in v1; v1 has one kind of event, an activity.
3. Within how many days is a user's account and data removed on request? 30 days was offered as an example. — Owner: user.
4. What exactly is on the fixed list of tags? — Owner: user.
5. Are chat or comments on events wanted later? Not in the requirements and not ruled out as a non-goal. — Owner: user.
