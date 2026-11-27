# Whole-site Login Wall with Polish Interface — Plan Brief

> Full plan: `context/changes/login-wall-polish/plan.md`

## What & Why

Make Lokalsi login-only and Polish-only as the PRD requires: a visitor sees nothing but sign-up/login until signed in, sessions persist across visits, and every piece of interface text is Polish. Every later slice (map, events, profile) assumes a logged-in user, so this goes first.

## Starting Point

Auth already works (Supabase cookie sessions, sign-in/up/out routes and forms), but only `/dashboard` is gated, all text is English starter copy, and Supabase's raw English error messages are shown to users.

## Desired End State

Anonymous requests to any page redirect to sign-in and any non-auth API call returns 401. A signed-in user lands on a minimal Polish home with a sign-out button. Auth screens, validation and errors are Polish, and the starter marketing/demo pages are gone.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Gate model | Default-deny allowlist (`/auth/*`, signin/signup API, static assets) | New routes from later slices are protected automatically. |
| API when anonymous | `401` for non-auth `/api/*`, redirect for pages | Correct semantics for non-browser callers and form posts. |
| Signed-in on auth pages | Redirect to `/` | Avoids showing a login form to a logged-in user. |
| Logged-in landing | One minimal Polish home at `/`; delete `/dashboard`, Welcome, Topbar | One placeholder that S-03 replaces with the map; no dead starter pages. |
| Auth errors | Map Supabase `error.code` to Polish in `src/lib/auth-errors.ts`, generic Polish fallback | Specific messages with no English leaks. |
| Verification | Extend `scripts/smoke.mjs` plus manual Polish/persistence checks | Reuses the CI-run smoke test; no new test runner. |

## Scope

**In scope:** middleware gate, Polish translation of all auth UI and errors, `lang="pl"`, minimal logged-in home, smoke test and CLAUDE.md updates.

**Out of scope:** password reset, email verification, profile/display name, second language, any map or event feature, changes to Supabase session settings.

## Architecture / Approach

The middleware (`src/middleware.ts`) already resolves the user on every request; it becomes a default-deny gate with one named allowlist constant. Copy is edited in place in the existing Astro/React files. A single new helper maps Supabase error codes to Polish and is used by the signin and signup API routes.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Login wall | Default-deny gate, 401 for API, signed-in bounce, smoke gate steps | Allowlist too broad or too narrow; auth pages unreachable |
| 2. Polish auth flow | Translated auth pages/forms, `lang="pl"`, error mapper, Polish error smoke check | Missed English strings; unmapped Supabase codes |
| 3. Polish logged-in home | Minimal home at `/`, starter pages deleted, final smoke shape | Dangling references to deleted files |

**Prerequisites:** local Supabase or hosted project reachable for the smoke test (`npx supabase start` or `.dev.vars`).
**Estimated effort:** ~1–2 sessions across 3 small phases.

## Open Risks & Assumptions

- "Stay logged in across visits" is assumed to work via `@supabase/ssr` default cookie lifetimes; verified manually in Phase 3 rather than changed.
- Supabase error codes can vary by version; the generic Polish fallback covers unmapped codes.

## Success Criteria (Summary)

- Anonymous visitors can reach nothing except sign-in and sign-up.
- A new user can sign up, sign in, stay signed in after restarting the browser, and sign out.
- No English text is visible anywhere in the app, including errors.
