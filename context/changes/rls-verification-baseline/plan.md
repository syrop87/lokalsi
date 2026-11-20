# RLS Verification Baseline Implementation Plan

## Overview

Roadmap item F-01. Prove that the migration workflow works end to end (local Supabase, CI, hosted project) and that Row Level Security keeps one user from changing another user's row. The pattern is carried by a minimal real `public.profiles` table and checked by a repeatable two-user script. Later slices (S-02 profiles, S-03 events, S-07 cancel) reuse the pattern and the script.

## Current State Analysis

- No data layer: `supabase/migrations/` does not exist, `supabase/config.toml` enables `./seed.sql` but there is no such file.
- Auth works (sign-up/in/out, middleware) with email confirmation off, so test users can be created through the auth API without email steps.
- CI `smoke` job (`.github/workflows/ci.yml`) already runs `supabase start` (db, auth, API kept) and `scripts/smoke.mjs`; `supabase start` applies `supabase/migrations/` automatically.
- `scripts/smoke.mjs` is the style to follow: zero dependencies, plain `fetch`, unique timestamped emails, named steps with expected outcomes.
- `infrastructure.md`: `wrangler rollback` does not revert schema or RLS; production DB changes need human approval. This is the risk F-01 retires.
- CLAUDE.md hard rule: RLS enabled on new tables with granular per-operation, per-role policies. Migration naming: `YYYYMMDDHHmmss_short_description.sql`.
- Unknown at planning time: whether the hosted project is linked to the Supabase CLI. Phase 3 verifies and links it by hand.

## Desired End State

- `supabase/migrations/<ts>_profiles_rls.sql` creates `public.profiles` with RLS enabled and per-operation, per-role policies.
- `npm run rls-check` exits 0 against any Supabase instance reachable through `SUPABASE_URL` / `SUPABASE_KEY`, and non-zero if any author-only guarantee fails.
- The check runs in CI (`smoke` job) on every push/PR and has been run once, successfully, against the hosted project after a manual `supabase db push`.
- A short runbook documents how to push migrations and run the check against hosted.

### Key Discoveries:

- `.github/workflows/ci.yml` smoke job writes `supabase.env` (API_URL, ANON_KEY) — the check can reuse those values.
- PostgREST returns an empty array (not an error) for an UPDATE/DELETE that RLS filters out, and an error (code `42501`) for an INSERT that violates policy. The check must assert on rows returned, not on status code alone.
- `supabase/config.toml` `[auth] enable_signup = true`, `enable_confirmations = false` (local); hosted behaviour assumed the same (commit 873d50e).

## What We're NOT Doing

- No `profiles` columns beyond identity: no self-description, no hobbies (S-02).
- No `events` table or event policies (S-03); no cancel logic (S-07).
- No admin policies — the admin works by hand with the service role outside the site (PRD).
- No UI, no API routes, no changes to `src/`.
- No CI job that pushes migrations to hosted; no service-role key in CI.
- No pgTAP / `supabase test db`.
- No automatic cleanup of test users left by hosted runs (manual cleanup documented).

## Implementation Approach

One owner-based pattern: a row belongs to `auth.uid()`; anyone logged in may read; only the owner may update; nobody may insert or delete through the API. Rows are created by a trigger on `auth.users` and removed by cascade when the auth user is deleted (admin, by hand). The check script exercises exactly these rules from the outside, as real API clients, so the same script validates local, CI and hosted.

## Phase 1: Migration and policies

### Overview

Add the first migration: `profiles` table, RLS, policies, signup trigger.

### Changes Required:

#### 1. Profiles migration

**File**: `supabase/migrations/<YYYYMMDDHHmmss>_profiles_rls.sql`

**Intent**: Create the table that carries the author-only pattern and make sure every new auth user gets exactly one row. Include a comment block with the manual rollback statements (drop trigger, function, table) because rollback of schema is not automatic.

**Contract**:
- `public.profiles(id uuid primary key references auth.users(id) on delete cascade, display_name text, created_at timestamptz not null default now())`.
- `alter table public.profiles enable row level security`.
- Policies, one per operation and role: `select` to `authenticated` using `true`; `update` to `authenticated` using and with check `id = (select auth.uid())`. No `insert` or `delete` policy for `authenticated`; no policy of any kind for `anon`.
- Trigger function `public.handle_new_user()` (`security definer`, `set search_path = ''`) inserting `(id)` from `new.id`, fired `after insert on auth.users`.

### Success Criteria:

#### Automated Verification:

- Migration applies on a fresh local database: `npx supabase db reset`
- RLS is enabled and exactly the select and update policies exist on `public.profiles`
- Lint still passes: `npm run lint`

#### Manual Verification:

- Migration SQL reviewed: RLS enabled, no policy for `anon`, trigger function has a pinned `search_path`
- Rollback comment block present and its statements are correct

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase. Phase blocks use plain bullets — the corresponding `- [ ]` checkboxes live in the `## Progress` section at the bottom of the plan.

---

## Phase 2: Two-user check script

### Overview

A dependency-free script that proves the author-only rules from the outside.

### Changes Required:

#### 1. Check script

**File**: `scripts/rls-check.mjs`

**Intent**: Follow the style of `scripts/smoke.mjs` (no dependencies, `fetch`, named steps, non-zero exit on first failed expectation). Sign up users A and B with unique emails, then exercise PostgREST as each.

**Contract**: Reads `SUPABASE_URL` and `SUPABASE_KEY` (anon key) from the environment; fails fast with a clear message if either is missing. Steps and expected outcomes:
1. A and B sign up (`/auth/v1/signup`), each gets an access token; each has a profile row (trigger worked).
2. As A: `select` sees both rows.
3. As A: update own row succeeds and returns the changed row.
4. As A: update B's row returns zero rows; as B, B's row is unchanged.
5. As A: change own `id` to B's id is rejected (with check).
6. As A: delete B's row returns zero rows; delete own row returns zero rows (no delete policy); both rows still exist.
7. As A: insert a row is rejected (policy violation).
8. Anonymous (no token, anon key only): select returns zero rows; update returns zero rows.

Prints one line per step and `RLS check passed` at the end. Test emails use the `rls-check-<timestamp>@example.com` pattern.

#### 2. npm script

**File**: `package.json`

**Intent**: Expose the check as `npm run rls-check`.

**Contract**: `"rls-check": "node scripts/rls-check.mjs"` under `scripts`.

### Success Criteria:

#### Automated Verification:

- Check passes against local Supabase after `supabase db reset`: `npm run rls-check`
- Check fails when a guard is removed (deliberate break): temporarily add a permissive update policy locally, re-run, expect non-zero exit, then revert
- Lint and format pass: `npm run lint`, `npx prettier --check scripts/rls-check.mjs`

#### Manual Verification:

- Output reads clearly: each guarantee has its own line, and a failure names the broken guarantee

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: CI wiring and hosted proof

### Overview

Run the check on every push/PR and once against the real hosted database.

### Changes Required:

#### 1. CI step

**File**: `.github/workflows/ci.yml`

**Intent**: In the existing `smoke` job, run the check against the local Supabase already started there, before the stop step.

**Contract**: New step after "Run smoke test against production preview": sources `supabase.env` and runs the check with `SUPABASE_URL=$API_URL` and `SUPABASE_KEY=$ANON_KEY`. The `if: always()` stop step stays last.

#### 2. Runbook

**File**: `context/changes/rls-verification-baseline/runbook.md`

**Intent**: Record the manual hosted procedure so S-02/S-03 reuse it.

**Contract**: Steps: `npx supabase login`, `npx supabase link --project-ref <ref>`, `npx supabase db push --dry-run` (review), `npx supabase db push`, then run `npm run rls-check` with the hosted URL and anon key, then delete the two `rls-check-*` users from the Supabase dashboard (Authentication > Users). Notes that a human approves `db push` per `infrastructure.md`, and that schema changes are not rolled back by `wrangler rollback`.

### Success Criteria:

#### Automated Verification:

- CI smoke job passes on a pull request with the new rls-check step
- Existing checks still pass: `npm run lint`, `npx astro check`, `npm run build`

#### Manual Verification:

- Human ran `supabase link`, `supabase db push --dry-run` and `supabase db push` against the hosted project
- `npm run rls-check` passes against the hosted project
- The two test users created by the hosted run were deleted from the dashboard
- Anonymous request to the hosted `/rest/v1/profiles` returns an empty array

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding.

---

## Testing Strategy

### Unit Tests:

- None; the check script is itself the test.

### Integration Tests:

- `npm run rls-check` against local (every CI run) and hosted (once, by hand; repeat after each migration touching RLS).

### Manual Testing Steps:

1. Local deliberate-break run (Phase 2) to confirm the check can fail.
2. Hosted run per runbook (Phase 3).
3. Delete the test users after the hosted run.

## Performance Considerations

None at this scale. Policies use `(select auth.uid())` so the value is evaluated once per statement.

## Migration Notes

First migration in the repo. Applied locally by `supabase start` / `db reset`, to hosted by manual `db push`. Schema rollback is manual (SQL in the migration's comment block). Hosted runs leave two `auth.users` rows, deletable via the dashboard, which cascades to profiles.

## References

- Roadmap: `context/foundation/roadmap.md` (F-01)
- PRD Access Control: `context/foundation/prd.md`
- Infra risks: `context/foundation/infrastructure.md`
- Style to follow: `scripts/smoke.mjs`; CI: `.github/workflows/ci.yml`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Migration and policies

#### Automated

- [x] 1.1 Migration applies on a fresh local database: `npx supabase db reset`
- [x] 1.2 RLS is enabled and exactly the select and update policies exist on `public.profiles`
- [x] 1.3 Lint still passes: `npm run lint`

#### Manual

- [x] 1.4 Migration SQL reviewed: RLS enabled, no policy for `anon`, trigger function has a pinned `search_path`
- [x] 1.5 Rollback comment block present and its statements are correct

### Phase 2: Two-user check script

#### Automated

- [ ] 2.1 Check passes against local Supabase after `supabase db reset`: `npm run rls-check`
- [ ] 2.2 Check fails when a guard is removed (deliberate break), then the break is reverted
- [ ] 2.3 Lint and format pass: `npm run lint`, `npx prettier --check scripts/rls-check.mjs`

#### Manual

- [ ] 2.4 Output reads clearly: each guarantee has its own line, and a failure names the broken guarantee

### Phase 3: CI wiring and hosted proof

#### Automated

- [ ] 3.1 CI smoke job passes on a pull request with the new rls-check step
- [ ] 3.2 Existing checks still pass: `npm run lint`, `npx astro check`, `npm run build`

#### Manual

- [ ] 3.3 Human ran `supabase link`, `supabase db push --dry-run` and `supabase db push` against the hosted project
- [ ] 3.4 `npm run rls-check` passes against the hosted project
- [ ] 3.5 The two test users created by the hosted run were deleted from the dashboard
- [ ] 3.6 Anonymous request to the hosted `/rest/v1/profiles` returns an empty array
