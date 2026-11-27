# Whole-site Login Wall with Polish Interface Implementation Plan

## Overview

Turn the existing auth starter into the v1 login wall: every route except sign-in/sign-up requires a session, all interface text (including auth errors) is Polish, and a minimal Polish home replaces the starter's marketing and demo pages. Covers FR-001 (sign up) and FR-002 (log in, stay logged in, log out) from the PRD, plus the PRD rules "unauthenticated visitor sees nothing but sign-up/login" and "all interface text in Polish".

## Current State Analysis

- Auth already works end to end: cookie-based Supabase SSR sessions (`src/lib/supabase.ts`), `signin`/`signup`/`signout` API routes, auth pages and React forms.
- The gate is a denylist: `PROTECTED_ROUTES = ["/dashboard"]` (`src/middleware.ts:4`). `/` and everything else is public.
- All visible text is English starter copy: `Welcome.astro`, `Topbar.astro`, `dashboard.astro`, auth pages, `SignInForm.tsx`, `SignUpForm.tsx`, `PasswordToggle.tsx` aria-labels, `confirm-email.astro`. `Layout.astro` has `lang="en"` and default title "10x Astro Starter". Only the config-warning banner in `Layout.astro` is already Polish.
- API routes redirect with the raw English `error.message` from Supabase in `?error=` (`signin.ts`, `signup.ts`), rendered by `ServerError.tsx`.
- `scripts/smoke.mjs` asserts `/` returns 200 for anonymous users and `/dashboard` redirects; both expectations change.
- Email confirmation is OFF (see `confirm-email.astro` comment), so sign-up creates an active account and the confirm page is a "registered, go sign in" page.

## Desired End State

- An anonymous request to any page redirects to `/auth/signin`; an anonymous request to any non-auth `/api/*` route gets `401`. Only `/auth/*`, `POST /api/auth/signin`, `POST /api/auth/signup` and static assets are reachable.
- A signed-in user visiting `/auth/signin` or `/auth/signup` is redirected to `/`.
- `/` for a signed-in user is a minimal Polish home: a greeting with their own email and a "Wyloguj" (sign out) button. `/dashboard`, `Welcome.astro` and `Topbar.astro` no longer exist.
- Every user-visible string is Polish, including validation messages, ARIA labels, page titles, `<html lang="pl">` and auth errors; no raw English Supabase message ever renders.
- Verify: `npm run lint`, `npm run build`, and `npm run smoke` against a running server all pass; manual check of persistence across a browser restart.

### Key Discoveries:

- `src/middleware.ts:4-23` — denylist gate; `context.locals.user` is already resolved on every request, so a default-deny allowlist is a small rewrite.
- `src/pages/api/auth/signin.ts` and `signup.ts` — redirect with `error.message`; the single place to swap in a Polish message mapper.
- `src/components/auth/ServerError.tsx` — renders whatever string it is given; needs no change once the API routes send Polish text.
- `src/components/Topbar.astro` shows only the signed-in user's own email, so the PRD rule "no email visible to other users" is not violated here; later slices must keep to it.
- `context/foundation/lessons.md` does not exist; no extra priors.

## What We're NOT Doing

- Password reset, email verification, social login (PRD non-goals).
- Display name / profile fields at sign-up (S-02, FR-003).
- A second language or a language switcher.
- The neighbourhood map or any event feature (S-03 onward).
- Changing Supabase auth settings, session lifetimes, or cookie options beyond verifying persistence.
- Adding a unit-test runner; verification is the extended smoke test plus manual checks.
- Translating the config-status banner or `Banner.astro` beyond what is already Polish.

## Implementation Approach

Three phases, gate first so the security-relevant behaviour is proven before any copy work. Phase 1 changes only the middleware and the smoke test's gate expectations, and temporarily keeps `/` rendering for signed-in users so the app stays working. Phase 2 localizes the auth flow and adds the error mapper. Phase 3 replaces the starter home and deletes the dead starter pages. Smoke steps are updated in the phase that changes the behaviour they assert so CI stays green after every phase.

## Phase 1: Login wall

### Overview

Replace the denylist with a default-deny allowlist and add the signed-in bounce, so the whole site requires login.

### Changes Required:

#### 1. Middleware gate

**File**: `src/middleware.ts`

**Intent**: Resolve the user as today, then deny by default: anonymous requests to anything outside the allowlist are redirected (pages) or rejected (API). Signed-in users who open the sign-in/sign-up pages are sent to `/`.

**Contract**:
- Public (no session needed): paths starting with `/auth/`, exactly `/api/auth/signin` and `/api/auth/signup`, and static asset paths (`/favicon.png`, `/_astro/`).
- `/api/auth/signout` requires no special-casing beyond default-deny (it is only meaningful with a session); keep it reachable for signed-in users.
- Anonymous + not public + path starts with `/api/` → `new Response(null, { status: 401 })`; anonymous + not public otherwise → `context.redirect("/auth/signin")`.
- Signed-in + path is `/auth/signin` or `/auth/signup` → `context.redirect("/")`. `/auth/confirm-email` stays reachable by signed-in users (sign-up redirects there before any session exists; harmless either way).
- The allowlist is a single named constant so later slices add public routes deliberately.

#### 2. Smoke test gate expectations

**File**: `scripts/smoke.mjs`

**Intent**: Match the new behaviour: `/` is gated for anonymous users, non-auth API calls are rejected, and signed-in users bounce off the auth pages.

**Contract**: Replace "home renders" with "home redirects anonymous user" (`302` → `/auth/signin`). Add "sample api route rejects anonymous user" (`GET /api/nonexistent-probe` → `401`; the gate runs before routing, so no real route is needed). Add after sign-in: "signed-in user bounces off signin page" (`GET /auth/signin` → `302` → `/`). Keep the `/dashboard` steps for now; Phase 3 replaces them.

### Success Criteria:

#### Automated Verification:

- Linting passes: `npm run lint`
- Production build passes: `npm run build`
- Smoke test passes against a running dev server, including the new gate steps: `npm run smoke`

#### Manual Verification:

- In a private window, opening `/` redirects to the sign-in page
- After signing in, opening `/auth/signin` lands on `/`
- Sign-up and sign-in still work end to end

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Polish auth flow

### Overview

Make the whole sign-up / sign-in path Polish, including server-side errors, and extend the smoke test to prove the error path is Polish.

### Changes Required:

#### 1. Document language and default title

**File**: `src/layouts/Layout.astro`

**Intent**: Declare the document as Polish and use the product name as the default title.

**Contract**: `<html lang="pl">`; default `title` = `"Lokalsi"`.

#### 2. Auth pages

**Files**: `src/pages/auth/signin.astro`, `src/pages/auth/signup.astro`, `src/pages/auth/confirm-email.astro`

**Intent**: Translate headings, titles, helper links and the confirmation copy to Polish ("Zaloguj się", "Zarejestruj się", "Nie masz konta?", "Masz już konto?", "Rejestracja zakończona" etc.).

**Contract**: Copy-only edits; the confirm-email file keeps its existing explanatory comment about email confirmation being off.

#### 3. Auth forms and controls

**Files**: `src/components/auth/SignInForm.tsx`, `src/components/auth/SignUpForm.tsx`, `src/components/auth/PasswordToggle.tsx`

**Intent**: Translate labels, placeholders, client-side validation messages, submit/pending text, the "n more characters needed" hint (with correct Polish plural forms) and the password toggle `aria-label`s.

**Contract**: Polish plural handling for the password hint uses `Intl.PluralRules("pl")` (forms: one / few / many) rather than the English `s` suffix. No Next.js directives; no new hooks required.

#### 4. Auth error mapper

**File**: `src/lib/auth-errors.ts` (new)

**Intent**: One place that turns a Supabase `AuthError` into a Polish message, so no raw English text reaches the UI.

**Contract**: `export function polishAuthError(error: { code?: string; message: string }, context: "signin" | "signup"): string`. Maps at least `invalid_credentials` (wrong email/password), `user_already_exists` / `email_exists`, `weak_password`, `over_request_rate_limit` / `over_email_send_rate_limit`, `email_address_invalid`; any other or missing code returns a generic Polish message for the given context. Never returns `error.message`.

#### 5. API routes use the mapper

**Files**: `src/pages/api/auth/signin.ts`, `src/pages/api/auth/signup.ts`

**Intent**: Redirect with the mapped Polish message, and translate the "Supabase is not configured" literal too.

**Contract**: `?error=${encodeURIComponent(polishAuthError(error, "signin"|"signup"))}`; the not-configured branch uses a Polish constant. Route contracts (`prerender = false`, `POST`, zod validation as already present or added) must follow the repo's API-route rules: if `prerender` is not yet exported in these files, add `export const prerender = false`.

#### 6. Smoke test error check

**File**: `scripts/smoke.mjs`

**Intent**: Prove the wrong-password path yields a Polish, non-English message.

**Contract**: Change the "signin rejects wrong password" step to also assert the decoded `error` query param equals the Polish `invalid_credentials` message (the step helper must expose the full `location`, which it already returns).

### Success Criteria:

#### Automated Verification:

- Linting passes: `npm run lint`
- Production build passes: `npm run build`
- Smoke test passes, including the Polish error assertion: `npm run smoke`
- No English UI strings remain in auth files (spot check): `grep -rniE "sign (in|up)|password is required|enter a valid" src/pages/auth src/components/auth` returns nothing

#### Manual Verification:

- Sign-in and sign-up pages, validation errors and pending states read naturally in Polish
- Wrong password, already-registered email and too-short password each show a Polish error
- Password hint shows correct plural forms for 1, 2–4 and 5+ missing characters (e.g. "Brakuje jeszcze 1 znaku", "2 znaków")
- Browser tab title and `<html lang>` are Polish

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Polish logged-in home

### Overview

Replace the starter marketing and demo pages with one minimal Polish home and remove everything now dead.

### Changes Required:

#### 1. Logged-in home

**File**: `src/pages/index.astro`

**Intent**: Render a minimal home for the signed-in user (the gate guarantees a user): app name, a short Polish placeholder line, the user's own email, and a "Wyloguj" button posting to `/api/auth/signout`.

**Contract**: Uses `Layout.astro` and the existing cosmic styling/classes already used by the auth pages; sign-out is a `<form method="POST" action="/api/auth/signout">`. Shows only `Astro.locals.user.email` (the viewer's own). Sign-out redirects to `/`, which the gate sends on to `/auth/signin`; keep as is.

#### 2. Remove starter pages

**Files**: delete `src/components/Welcome.astro`, `src/components/Topbar.astro`, `src/pages/dashboard.astro`

**Intent**: Remove English starter marketing/demo pages that no longer have a route or a purpose.

**Contract**: Grep confirms no remaining imports or links to the deleted files or to `/dashboard` (middleware, docs, smoke test).

#### 3. Smoke test final shape

**File**: `scripts/smoke.mjs`

**Intent**: Replace the `/dashboard` steps with `/`.

**Contract**: "home renders for signed-in user" (`GET /` → `200`) after sign-in; after sign-out, "home redirects after signout" (`302` → `/auth/signin`). Remove the "dashboard ..." steps.

#### 4. Docs touch-up

**File**: `CLAUDE.md`

**Intent**: Keep the architecture notes true: the middleware now default-denies with an allowlist, and `src/pages/dashboard.astro` no longer exists.

**Contract**: Edit the "Auth flow" bullets only (the `PROTECTED_ROUTES` description and the "Protected page example" line).

### Success Criteria:

#### Automated Verification:

- Linting passes: `npm run lint`
- Formatting is clean: `npm run format -- --check`
- Production build passes: `npm run build`
- Smoke test passes against a running server: `npm run smoke`
- No dangling references: `grep -rn "dashboard\|Welcome\|Topbar" src scripts` returns nothing

#### Manual Verification:

- Sign up a new account, land on the Polish home, close and reopen the browser, and still be signed in (stay logged in across visits)
- "Wyloguj" returns to the sign-in page and the home is no longer reachable
- In a private window, every sampled route (`/`, `/dashboard`, `/foo`) redirects to sign-in, and `/api/anything` returns 401
- Walking through every screen shows no English text
- Check the deployed preview at the Worker URL if deploying as part of this change

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before closing the change.

---

## Testing Strategy

### Unit Tests:

- None; the repo has no unit-test runner and adding one is out of proportion for this change.

### Integration Tests:

- `scripts/smoke.mjs` is the automated check: anonymous gate on `/` and API, signed-in bounce off `/auth/signin`, Polish error on wrong password, sign-up/sign-in/sign-out, home render, post-sign-out gate. CI already runs it against the production preview with a local Supabase.

### Manual Testing Steps:

1. Private window: open `/`, `/dashboard`, `/random` → each redirects to the sign-in page.
2. Sign up with a new email; confirm the Polish success page, then sign in.
3. Land on `/`; close and reopen the browser; confirm still signed in.
4. Try wrong password, duplicate email, 3-character password; confirm Polish errors.
5. Sign out; confirm redirect and gate.

## Performance Considerations

The middleware already calls `supabase.auth.getUser()` on every request; the allowlist adds only string comparisons. Public paths could skip that call, but the call is kept because it also refreshes session cookies. No change.

## Migration Notes

No data or schema changes. Existing sessions keep working. No rollback concerns beyond reverting the commits.

## References

- Roadmap item: `context/foundation/roadmap.md` (S-01, `login-wall-polish`)
- PRD: `context/foundation/prd.md` (FR-001, FR-002, lines 140–143 and 162–165)
- Gate today: `src/middleware.ts:4-23`
- Error redirects today: `src/pages/api/auth/signin.ts`, `src/pages/api/auth/signup.ts`
- Smoke test: `scripts/smoke.mjs`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Login wall

#### Automated

- [x] 1.1 Linting passes: `npm run lint` — 597a4d5
- [x] 1.2 Production build passes: `npm run build` — 597a4d5
- [x] 1.3 Smoke test passes against a running dev server, including the new gate steps: `npm run smoke` — 597a4d5

#### Manual

- [x] 1.4 In a private window, opening `/` redirects to the sign-in page — 597a4d5
- [x] 1.5 After signing in, opening `/auth/signin` lands on `/` — 597a4d5
- [x] 1.6 Sign-up and sign-in still work end to end — 597a4d5

### Phase 2: Polish auth flow

#### Automated

- [x] 2.1 Linting passes: `npm run lint` — 94d9571
- [x] 2.2 Production build passes: `npm run build` — 94d9571
- [x] 2.3 Smoke test passes, including the Polish error assertion: `npm run smoke` — 94d9571
- [x] 2.4 No English UI strings remain in auth files (spot check grep returns nothing) — 94d9571

#### Manual

- [x] 2.5 Sign-in and sign-up pages, validation errors and pending states read naturally in Polish — 94d9571
- [x] 2.6 Wrong password, already-registered email and too-short password each show a Polish error — 94d9571
- [x] 2.7 Password hint shows correct plural forms for 1, 2–4 and 5+ missing characters — 94d9571
- [x] 2.8 Browser tab title and `<html lang>` are Polish — 94d9571

### Phase 3: Polish logged-in home

#### Automated

- [x] 3.1 Linting passes: `npm run lint`
- [x] 3.2 Formatting is clean: `npm run format -- --check`
- [x] 3.3 Production build passes: `npm run build`
- [x] 3.4 Smoke test passes against a running server: `npm run smoke`
- [x] 3.5 No dangling references to dashboard, Welcome or Topbar in `src` and `scripts`

#### Manual

- [x] 3.6 Sign up, land on the Polish home, close and reopen the browser, and still be signed in
- [x] 3.7 "Wyloguj" returns to the sign-in page and the home is no longer reachable
- [x] 3.8 In a private window, every sampled route redirects to sign-in and `/api/anything` returns 401
- [x] 3.9 Walking through every screen shows no English text
