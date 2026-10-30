---
project: Lokalsi
researched_at: 2026-10-30
recommended_platform: Cloudflare Workers
runner_up: Netlify
context_type: mvp
tech_stack:
  language: TypeScript
  framework: Astro 7 (SSR) + React 19
  runtime: Cloudflare workerd (@astrojs/cloudflare ^14.3.1)
---

## Recommendation

**Deploy on Cloudflare Workers** (Workers with static assets, not Cloudflare Pages), with Supabase as an external database/auth provider.

The repo is already a Workers project (`wrangler.jsonc` has `main: @astrojs/cloudflare/entrypoints/server` and an `assets` block), so this needs no adapter swap. It fits the interview answers: no persistent connections, minimize cost (free plan covers ~100 users), single region, and external providers are fine (Supabase). The user chose to proceed after the cross-check.

Note: `tech-stack.md` originally said `deployment_target: cloudflare-pages`, the starter's default label, which did not match the code. It has been corrected to `cloudflare-workers` and now names Supabase. Pages and Workers use different deploy commands (`wrangler pages deploy` vs `wrangler deploy`); use the Workers ones.

External dependency (not recorded in `tech-stack.md`): **Supabase** (Postgres + auth + RLS), env vars `SUPABASE_URL` and `SUPABASE_KEY`.

Interview answers: persistent connections = No; priority = minimize cost; familiarity = none; reach = single region; co-location = external providers fine.

## Platform Comparison

| Platform | CLI-first | Managed | Agent docs | Stable deploy | MCP | Cost fit | Stack fit |
|---|---|---|---|---|---|---|---|
| **Cloudflare Workers** | Pass | Pass | Pass | Pass | Pass | Pass (free tier) | Pass (adapter installed) |
| Netlify | Pass | Pass | Partial | Pass | Pass (official MCP) | Pass (free, credit-based) | Partial (adapter swap) |
| Vercel | Pass | Pass | Pass | Pass | Partial (beta) | Partial (Hobby is non-commercial only) | Partial (adapter swap) |
| Render | Partial | Pass | Partial | Pass | Partial | Fail (free tier sleeps ~1 min; paid from $7/mo) | Partial (Node adapter) |
| Railway | Pass | Pass | Partial | Pass | Partial | Partial (trial credit, then paid) | Partial (Node adapter) |
| Fly.io | Pass | Partial | Pass | Pass | Partial | Fail (no free tier) | Partial (Node adapter) |

Pricing and limits for the non-Cloudflare platforms come from third-party sources that disagree in places; verify on the vendor pages before relying on them. Checked 2026-10-30.

### Shortlisted Platforms

#### 1. Cloudflare Workers (Recommended)

Already wired in the repo. Free plan: 100,000 requests/day, 10 ms CPU per request (waiting on network calls does not count), per the official limits page. Deploy with `wrangler deploy`, roll back with `wrangler rollback`, optional Git-push builds via Workers Builds. Agent-readable docs and MCP servers exist (MCP status not re-verified in this run).

#### 2. Netlify

Free credit-based plan (300 credits/month per third-party sources, after the April 2026 pricing change), official MCP server, Astro adapter. Gap: requires swapping the adapter and config, and a traffic spike could exhaust credits.

#### 3. Vercel

Strong CLI and docs. Gap: Hobby plan is restricted to personal, non-commercial use per third-party sources (official fair-use page not read), and it needs an adapter swap.

## Anti-Bias Cross-Check: Cloudflare Workers

### Devil's Advocate — Weaknesses

1. The Free plan allows 10 ms CPU per request. React server rendering plus the session check can use 10–20 ms, so some requests may hit the limit. The paid plan ($5/month) is the fallback.
2. The Free plan hard-stops at 100,000 requests/day (error 1027). Fine for ~100 users, but a bot or scraper could exhaust it.
3. Runtime is workerd, not full Node. Some npm packages fail only after deploy.
4. `wrangler rollback` reverts Worker code only. Supabase schema and RLS policy changes are not rolled back, and RLS enforces the PRD guardrail that only the author can cancel an event.
5. Each request makes a round trip to Supabase, which lives in one region. The Supabase region matters more than Cloudflare's edge placement.

### Pre-Mortem — How This Could Fail

Week 9, launch goes well and the first 100 neighbours sign up. The map starts throwing intermittent CPU and request-limit errors because Free-plan limits hit the server-rendered pages, and nobody tested on the production runtime. Meanwhile the Supabase free project paused after a quiet week, so login stopped working and no alert existed. Deploys were done from a laptop with a broadly scoped token. CI never ran because it watched `master` while the repo used `main`, so a broken RLS migration shipped straight to production. The rollback restored the Worker code but not the database policy. For two days anyone could cancel anyone's event, breaking the main guardrail of the PRD. The builder, working after hours, found out from a neighbour.

### Unknown Unknowns

- `tech-stack.md` originally said Pages but the repo is a Workers project (now corrected); Workers commands are the correct ones.
- Supabase Free pauses projects after about 7 days of low activity (third-party sources quoting Supabase docs; not verified on supabase.com). A quiet neighbourhood app could hit this.
- Choose an EU Supabase region (Frankfurt, Ireland or Paris) for Polish users.
- `SUPABASE_URL` and `SUPABASE_KEY` are needed in the Worker's runtime secrets and in the build environment. `.dev.vars` is local only.
- No documentation for `@astrojs/cloudflare` v14 was found in this run. Verify the dev and deploy workflow against the pinned versions.

## Operational Story

- **Preview deploys**: Workers Builds (Git integration) can build on push and report status on GitHub PRs. Preview URL behaviour and protection (e.g. Cloudflare Access) were not verified; confirm when enabling.
- **Secrets**: Worker secrets set with `wrangler secret put` (or the dashboard) for runtime; GitHub Actions secrets `SUPABASE_URL` / `SUPABASE_KEY` for CI builds; `.dev.vars` (gitignored) locally.
- **Rollback**: `wrangler rollback [VERSION_ID]` creates a new deployment from a previous version (up to 100 recent versions available). Code only; database migrations do not roll back. Rollback can fail if bound KV/D1 resources changed.
- **Approval**: Human approves production deploys, secret rotation, and anything destructive (dropping tables, deleting the Worker or Supabase project). An agent may run builds, lint, and preview/local commands.
- **Logs**: `observability` is enabled in `wrangler.jsonc`. Read live logs with `npx wrangler tail`; deployment history with `npx wrangler deployments list`. Use a read-only scoped token for agent access.

## Risk Register

| Risk | Source | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Free-plan 10 ms CPU limit hit by SSR pages | Devil's advocate | M | M | Test on the production runtime early; upgrade to Workers Paid ($5/mo) if errors appear |
| 100k requests/day cap exhausted by bot traffic | Devil's advocate | L | M | Monitor request counts; upgrade plan if needed |
| npm package incompatible with workerd | Devil's advocate | M | M | Check packages against workerd before adding them; test with `npm run preview` |
| Rollback does not revert Supabase schema/RLS | Devil's advocate | M | H | Keep migrations in `supabase/migrations/`; write reversible migrations; test RLS policies before deploy |
| Supabase round-trip latency from wrong region | Devil's advocate | M | L | Create the Supabase project in an EU region |
| Supabase Free project pauses when quiet | Unknown unknowns | M | H | Verify the pause rule on supabase.com; add a scheduled keep-alive or move to a paid plan before launch; add an uptime check |
| CI triggers on `master`, repo branch is `main` | Research finding | H | H | Change `ci.yml` branches to `main` |
| `tech-stack.md` said Pages, repo is Workers | Research finding | H | M | Resolved: `deployment_target` corrected to `cloudflare-workers`; use `wrangler deploy` |
| Over-broad deploy token | Pre-mortem | M | H | Use a Cloudflare API token scoped to this one Worker; store in env/GitHub secrets only |
| Quiet failures with no alert | Pre-mortem | M | M | Add an uptime check on the login page; review `wrangler tail` after each release |
| No docs found for @astrojs/cloudflare v14 | Unknown unknowns | M | M | Read the adapter docs for the pinned version before the first deploy |

## Getting Started

Commands below are based on this repo's config (`wrangler.jsonc`, `astro.config.mjs`, `package.json`); check them against the adapter v14 docs before the first deploy.

1. Local dev needs no separate Cloudflare command: `npm run dev` already runs on the workerd runtime (per `CLAUDE.md`). Put `SUPABASE_URL` and `SUPABASE_KEY` in `.dev.vars`.
2. Create a Supabase project in an EU region and apply `supabase/migrations/` with RLS enabled.
3. Create a Cloudflare account and authenticate: `npx wrangler login` (human step). For CI use a Worker-scoped API token.
4. Set runtime secrets: `npx wrangler secret put SUPABASE_URL` and `npx wrangler secret put SUPABASE_KEY`.
5. Build and deploy: `npm run build` then `npx wrangler deploy`. Verify with `npx wrangler deployments list`, then run `npm run smoke` against the deployed URL (`BASE_URL=...`).
6. Already done during this research: `.github/workflows/ci.yml` now triggers on `main`, and `deployment_target` in `tech-stack.md` is `cloudflare-workers`.

## Out of Scope

The following were not evaluated in this research:
- Docker image configuration
- CI/CD pipeline setup
- Production-scale architecture (multi-region, HA, DR)
