<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Whole-site Login Wall with Polish Interface

- **Plan**: context/changes/login-wall-polish/plan.md
- **Scope**: Full plan (3 of 3 phases)
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-11-27
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 3 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | WARNING |
| Success Criteria | PASS |

Notes: every planned change is MATCH, nothing MISSING. Extras beyond the plan were user-approved and committed separately (dev-local.mjs, dev:local/smoke:local, smoke `--local` guard, `.gitignore` `.dev.vars.*`, rls-check.mjs comment reword, roadmap status flips). Automated criteria re-run at review time: lint PASS, prettier PASS, build PASS, dangling-ref grep clean; smoke passed at phase 3 (not re-run, it needs a server). All 23 Progress rows are `[x]`; manual rows were confirmed by the user in-session. The middleware gate was checked for bypasses (path normalization, `/authx`, trailing slash, encoded paths, getUser vs getSession, open redirects) and none was found; it fails closed.

## Findings

### F1 — Smoke `--local` guard can give false assurance

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: scripts/smoke.mjs:15-22
- **Detail**: The guard reads a config file chosen by the `--local` flag, not what the running server actually loaded. (a) If `.dev.vars.local` is missing, the `catch` skips the check silently; Wrangler then (per reviewer's knowledge, untested) falls back to `.dev.vars`, so `dev:local` + `smoke:local` would sign up a user on the hosted project. (b) `smoke:local` against a server started with plain `npm run dev` reads `.dev.vars.local` (local URL), passes, and hits hosted. `process.env.SUPABASE_URL` is never consulted.
- **Fix**: With `--local`, exit with an error when `.dev.vars.local` is absent; and state in the guard comment and CLAUDE.md that it is best-effort.
  - Strength: Closes the missing-file hole in a few lines and keeps the guard dependency-free.
  - Tradeoff: Case (b) stays possible; a full fix needs the server to report its Supabase host.
  - Confidence: HIGH — the empty `catch` is visible in the code; MED on the Wrangler fallback (not tested).
  - Blind spot: Wrangler's exact fallback behaviour was not exercised.
- **Decision**: FIXED — `--local` now exits with an error when `.dev.vars.local` is missing; guard comment says it is best-effort (plain-dev-server mismatch remains). Verified by moving the file aside.

### F2 — `?error=` is rendered verbatim on the auth pages

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/pages/auth/signin.astro:5, src/pages/auth/signup.astro
- **Detail**: The pages pass `Astro.url.searchParams.get("error")` straight into `ServerError`. React escapes it (no XSS), but anyone can craft `/auth/signin?error=<any text>` and it appears in the red error box on the site's own domain (content spoofing / phishing text). The API routes only ever send fixed Polish strings, so the page could accept only those.
- **Fix A ⭐ Recommended**: Redirect with an error code (`?error=invalid_credentials`) and map code to Polish text on the page.
  - Strength: The page can only ever show known strings; the mapper in `auth-errors.ts` already holds the texts.
  - Tradeoff: Touches both API routes, both pages and the mapper's export shape; the smoke assertion changes to the code.
  - Confidence: HIGH — contained change on a known path.
  - Blind spot: None significant.
- **Fix B**: Keep the message in the URL but whitelist it on the page against the known Polish strings.
  - Strength: Smaller diff; smoke test unchanged.
  - Tradeoff: Duplicates the string list or needs an export; messages stay in URLs.
  - Confidence: MEDIUM — works, but couples page and mapper by text.
  - Blind spot: Fallback behaviour for unknown text (drop the param) not designed.
- **Decision**: SKIPPED

### F3 — No input validation in auth routes (zod rule, unhandled 500)

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Pattern Consistency
- **Location**: src/pages/api/auth/signin.ts:9-11, src/pages/api/auth/signup.ts:9-11
- **Detail**: CLAUDE.md says "validate input with zod", but zod is not in package.json and the routes cast `form.get(...) as string`. A missing field becomes `null` (or a `File`) passed to Supabase, and a non-form Content-Type makes `request.formData()` throw an unhandled 500. This predates the change and the plan only said "as already present or added", so it is not drift. Supabase still rejects bad input and enforces the 6-character minimum, so it is a rule violation, not a security hole.
- **Fix**: Wrap `formData()` in try/catch and validate `email`/`password` as non-empty strings, redirecting with the generic Polish error on failure; add zod only if you want to follow the rule literally.
  - Strength: Removes the 500 and the null/File cases.
  - Tradeoff: Adding zod is a new dependency; hand-rolled checks deviate from the stated rule.
  - Confidence: HIGH — behaviour read directly from the code.
  - Blind spot: The 500 on a non-form Content-Type was reasoned from Astro behaviour, not triggered.
- **Decision**: FIXED — new `src/lib/auth-form.ts` (`readCredentials`: formData in try/catch, email/password must be non-empty strings) used by signin and signup; invalid input redirects with `INVALID_FORM_MESSAGE` ("Wypełnij wszystkie pola."). No zod added (hand-rolled, as proposed). Verified: JSON body, missing field and empty signup all give a 302 with the Polish message, smoke passes.

### F4 — Sign-up reveals whether an email is registered

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/lib/auth-errors.ts:11-12
- **Detail**: `user_already_exists` / `email_exists` map to "Konto z tym adresem e-mail już istnieje.", letting anyone probe for registered emails. Supabase returns the explicit error because `enable_confirmations = false`. Sign-in is fine (one message for all credential failures). This is a deliberate UX trade-off for newcomers; rate limits cap abuse.
- **Fix**: Keep as is and record it as a decision, or switch to the generic sign-up message.
  - Strength (keep): Newcomers learn they already have an account.
  - Tradeoff (keep): Email enumeration remains possible.
  - Confidence: HIGH — read from code and config.
  - Blind spot: The PRD privacy rule covers only showing emails to other users, not enumeration.
- **Decision**: SKIPPED — explicit "account already exists" message kept for now.

### F5 — Signed-out click on "Wyloguj" gets a blank 401

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/middleware.ts:12-13, 25-27
- **Detail**: `/api/auth/signout` is not public, so a stale tab whose session already ended gets a blank 401 page instead of landing on sign-in. Signout is idempotent and already handles a null session.
- **Fix**: Add `/api/auth/signout` to `PUBLIC_PATHS_EXACT` (a signed-out POST then redirects to `/`, then to sign-in).
- **Decision**: FIXED — `/api/auth/signout` added to `PUBLIC_PATHS_EXACT`; CLAUDE.md Auth bullet updated to list it. Verified: anonymous POST now 302 -> `/` (then sign-in), `/api/anything` still 401, smoke passes.

### F6 — Minor middleware and docs nits

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architecture
- **Location**: src/middleware.ts:12, 14-20; CLAUDE.md (Auth flow bullet); public/template.png
- **Detail**: (1) `/auth/` is a prefix, so any future page under `/auth/` is public by default; add a one-line comment saying so. (2) `getUser()` runs before the public-path check, so signed-in `/_astro/*` and `/favicon.png` requests cost a Supabase call (Cloudflare usually serves assets before the worker, so likely moot). (3) The CLAUDE.md bullet writes "`POST /api/auth/signin`" but the code allows any method on those paths. (4) `public/template.png` is unreferenced and now behind the login wall.
- **Fix**: Add the prefix comment and reword the CLAUDE.md bullet; leave the rest.
- **Decision**: FIXED — comment added in `src/middleware.ts` that everything under `/auth/` is public by default; CLAUDE.md wording was already corrected under F5. `getUser()` ordering and `public/template.png` left alone, as proposed.
