# RLS Verification Baseline — Plan Brief

> Full plan: `context/changes/rls-verification-baseline/plan.md`

## What & Why

Prove that database migrations work against the hosted Supabase project and that Row Level Security stops one user from changing another's row. Later slices (profiles, events, cancel) each add tables; proving the pattern once keeps them from inventing it, and `wrangler rollback` cannot undo a broken policy, so the check must exist before the real data does.

## Starting Point

No migrations, no tables, no `seed.sql`. Auth works; CI already starts a local Supabase and runs a dependency-free smoke script (`scripts/smoke.mjs`) that this work mirrors.

## Desired End State

A first migration creates `public.profiles` with RLS. `npm run rls-check` signs up two users and proves they cannot change each other's rows, and anonymous users see nothing. It runs on every CI build and has passed once against the hosted project.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Pattern table | Real minimal `profiles` (id, display_name, created_at) | No throwaway; S-02 extends it | Plan |
| Policies | select: authenticated; update: owner only; no insert/delete via API; none for anon | Smallest rule set that proves author-only | Plan |
| Row creation | Trigger on `auth.users` insert; cascade delete | Users cannot insert rows themselves | Plan |
| Check method | Node script over the HTTP API | Same code for local, CI and hosted; matches smoke.mjs | Plan |
| Hosted migration | Manual `supabase db push` by a human | Matches approval rule in infrastructure.md; no new CI secrets | Plan |
| Where it runs | Local + CI smoke job + hosted by hand | Catches breakage pre-merge and verifies the real DB | Plan |

## Scope

**In scope:** profiles migration and policies; `scripts/rls-check.mjs` + npm script; CI step; hosted runbook and one hosted run.

**Out of scope:** profile columns beyond identity; events table; admin policies; UI/API; CI pushing to hosted; pgTAP; automatic test-user cleanup.

## Architecture / Approach

Owner-based RLS: a row belongs to `auth.uid()`, logged-in users read, only the owner updates, nobody inserts or deletes through the API. The script drives the public API as real users, so it tests what the app will actually hit.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Migration and policies | `profiles` table, RLS, signup trigger | Trigger `security definer` pitfalls (search_path) |
| 2. Two-user check script | `npm run rls-check`, with deliberate-break proof | RLS filters silently (empty array, not error) — assert on rows |
| 3. CI wiring and hosted proof | CI step, runbook, hosted run | Hosted project not linked yet; test users left in prod auth |

**Prerequisites:** Docker for local Supabase; Supabase CLI login and the hosted project ref/DB password for Phase 3.
**Estimated effort:** ~2 sessions across 3 phases.

## Open Risks & Assumptions

- Assumes hosted email confirmation is off, as locally; otherwise the check's sign-ups need adjusting.
- Hosted runs leave two test users to delete by hand.
- Schema rollback is manual SQL, not automatic.

## Success Criteria (Summary)

- `npm run rls-check` passes locally, in CI and on hosted, and fails when a policy is deliberately loosened.
- Only a row's owner can change it; anonymous visitors see nothing.
