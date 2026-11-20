# First deployment: remaining steps for lokalsi (Cloudflare Workers + Supabase)

Status: **plan approved, execution NOT started.** Manual gates in section A are not completed yet; nothing in B runs until they are.

## Context
`infrastructure.md` "Getting Started" lists 6 steps. Read-only checks of the repo and accounts show what is already done and what is left. Goal: a verified, live production Worker, plus a repeatable deploy path.

## Status of Getting Started steps (verified 2026-11-20)

| # | Step | Status | Evidence |
|---|---|---|---|
| 1 | Local dev + `.dev.vars` | Done | `.dev.vars` has `SUPABASE_URL`, `SUPABASE_KEY` (hosted project `zbamerjlyvfnmrhwyujy.supabase.co`) |
| 2a | Supabase project in EU region | Host exists. Region not verified | URL is a hosted `*.supabase.co` project |
| 2b | Apply `supabase/migrations/` with RLS | **Not applicable yet**: no `supabase/migrations/` directory, no tables | `supabase/` has only `config.toml`. `project_id` is still the starter's `10x-astro-starter`. Project not linked (no `.temp/project-ref`) |
| 3 | `wrangler login` | Done | `wrangler whoami` shows `pborys@gmail.com` (OAuth token; **not** a scoped CI token) |
| 4 | Worker secrets | Done | `wrangler secret list` shows `SUPABASE_URL`, `SUPABASE_KEY` |
| 5 | Build + `wrangler deploy` | **Unclear**: one `Upload` at 08:19 UTC, then 2 `Secret Change` entries. No record of which commit was uploaded, and `Rename Worker to lokalsi` was committed after it | `wrangler deployments list` |
| 5b | Verify + `npm run smoke` against deployed URL | **Not done** | no previous `deploy-plan.md` |
| 6 | `ci.yml` on `main` | Done in the file | `ci.yml` triggers on `main` |

## Gaps found (what is left)

1. **No git remote.** `git remote -v` is empty. GitHub Actions never runs, the "auto-deploy-on-merge" intent in `tech-stack.md` is not satisfiable, and the CI secrets cannot exist. (`gh` CLI is also not installed.)
2. **No automated deploy path.** `ci.yml` only lints, builds and smoke-tests. It has no deploy job.
3. **Deployed code is unverified.** Redeploy from current HEAD so the live version is known.
4. **Supabase side is untouched**: no migrations, the project is unlinked, and `config.toml` `project_id` is a placeholder. For the first deploy this only matters for auth. The RLS guardrail (only the author can cancel an event) is not deployable yet because there is no events table.
5. **Risk-register items still open before real users**: Supabase Free pause (keep-alive or uptime check), an uptime check on `/auth/signin`, a scoped token instead of the OAuth login for CI.

## Steps

### A. Manual gates (human) — NOT COMPLETED
1. Create the GitHub repo and add the remote: `git remote add origin <url>`, then `git push -u origin main`. `gh` is not installed: either install it and run `gh auth login`, or create an empty repo on github.com. Pushing is outward-facing and needs explicit approval at run time.
2. Supabase dashboard, **Authentication > URL Configuration**: set Site URL to the Worker URL, and add `<worker-url>/**` to the redirect allow-list. Otherwise signup email confirmation links will point at localhost. Also confirm the project region is EU.
3. Add GitHub Actions secrets `SUPABASE_URL`, `SUPABASE_KEY` (needed by the `ci` job build step).
4. Workers Builds (auto-deploy on merge): Cloudflare dashboard > Worker > Settings > Builds, connect the GitHub repo, build command `npm run build`, deploy command `npx wrangler deploy`, build-time vars `SUPABASE_URL` / `SUPABASE_KEY`.

### B. Agent-run (production deploy needs explicit approval)
1. `npm run lint` and `npx astro check`, then `npm run build`. Confirm clean.
2. `npm run preview` locally and `BASE_URL=http://localhost:4321 npm run smoke` as a sanity pass.
3. **Deploy:** `npx wrangler deploy` (Workers, not `wrangler pages deploy`). Production mutation: ask for approval first.
4. Verify: `npx wrangler deployments list` shows a new `Upload`. Take the workers.dev URL from the deploy output, then run `BASE_URL=https://lokalsi.<subdomain>.workers.dev npm run smoke`. Check `/dashboard` redirects to signin when logged out. Watch `npx wrangler tail` during the smoke run for CPU-limit or runtime errors.
5. Manually sign up and sign in once on the live URL (email confirmation flow, cookies over HTTPS).
6. Record results in this file.

### C. Follow-ups (not blocking first deploy)
- Add the first migration with RLS when the events table is built; `npx supabase link` and fix `project_id` then.
- Uptime check on the signin page and a Supabase keep-alive.
- Before real users: re-enable email confirmation and configure custom SMTP, and restore the "Check your email" text in `src/pages/auth/confirm-email.astro` (currently always says registration successful).

## Verification
- `wrangler deployments list` shows the new Upload, and `npm run smoke` passes against the live URL.
- Manual signup, signin and signout on the live URL work; `/dashboard` is protected.
- `wrangler tail` shows no exceptions or `Exceeded CPU` errors during the run.

## Decisions
- Create the GitHub repo as part of this work (human step, see A1).
- Auto-deploy: Workers Builds.

- Email confirmation stays OFF in Supabase for the MVP test phase (decided 2026-11-20). Revisit before real users: re-enable and set up custom SMTP.

## Resolved during execution
- Supabase region is `eu-west-2` (London). Email confirmation is off, so the Site URL and redirect allow-list only matter for future email links.
- Worker URL: `https://lokalsi.pborys.workers.dev` (responds 200 on `/auth/signin`).
- Gates done 2026-11-20: A1 (repo `syrop87/lokalsi` pushed), A2 (Supabase URL config), A3 (GitHub secrets). Open: A4 (Workers Builds).

## Execution results (2026-11-20)
- Gates A1-A4 done. CI fixed (`supabase/config.toml`: `[local_smtp]`, `project_id = "lokalsi"`), commit f345226, CI green.
- B1: `astro check` 0 errors, build OK. Local `npm run lint` shows CRLF-only errors (`core.autocrlf=true`); Linux CI lint passes.
- B2: local preview smoke passed 8/8.
- B3: `npx wrangler deploy` done, version `9551f406-da38-4fa0-8790-b65bf824be7b` at 09:17 UTC, 100% traffic, https://lokalsi.pborys.workers.dev.
- B4: smoke against live URL passed 8/8; anonymous `/dashboard` 302 to `/auth/signin`; `wrangler tail` showed 8 events, 0 exceptions / CPU errors.
- Open: B5 manual signup/signin in a browser on the live URL; delete smoke test users in Supabase (Authentication > Users); section C follow-ups.
