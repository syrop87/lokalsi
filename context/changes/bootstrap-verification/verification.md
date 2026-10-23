---
bootstrapped_at: 2026-10-23T09:56:00Z
starter_id: 10x-astro-starter
starter_name: "10x Astro Starter (Astro + Supabase + Cloudflare)"
project_name: lokalsi
language_family: js
package_manager: npm
cwd_strategy: git-clone
bootstrapper_confidence: first-class
phase_3_status: ok
audit_command: "npm audit --json"
---

# Bootstrap verification — lokalsi

## Hand-off

```yaml
starter_id: 10x-astro-starter
package_manager: npm
project_name: lokalsi
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
```

> **Why this stack** — Lokalsi is a login-only web app for about a hundred users in one neighbourhood, built solo after hours in 10 weeks by a Python developer new to web development. The 10x Astro Starter is the vetted default for a TypeScript web app and covers the must-haves that are hardest to get right alone: email-and-password accounts with persistent sessions, a PostgreSQL database, and deployment, all pre-wired. TypeScript with Zod schemas gives an AI agent explicit contracts to reason from, which compensates for the builder's unfamiliarity with the ecosystem. Known gaps to plan for: the interactive neighbourhood map is not part of the starter and must be added during implementation; database access rules must be configured early so that only an event's author can cancel it; Polish-only interface text and date formats need setting up from the start. Deployment defaults to Cloudflare Pages (chosen as the starter default, revisitable after scaffolding), with GitHub Actions auto-deploying on merge.

## Pre-scaffold verification

| Signal      | Value                                                        | Severity | Notes                                                                 |
| ----------- | ------------------------------------------------------------ | -------- | --------------------------------------------------------------------- |
| npm package | not run                                                      | —        | `cmd_template` is a `git clone`; no npm CLI to check                  |
| GitHub repo | przeprogramowani/10x-astro-starter last pushed 2026-09-12    | fresh    | from card `docs_url`; fetched via public GitHub API (`gh` not installed) |

## Scaffold log

**Resolved invocation**: `git clone https://github.com/przeprogramowani/10x-astro-starter .bootstrap-scaffold && cd .bootstrap-scaffold && npm install`
**Strategy**: git-clone (upstream `.git/` deleted before move-up)
**Exit code**: 0
**Files moved**: 21 top-level entries (AGENTS.md, astro.config.mjs, components.json, eslint.config.js, node_modules, package.json, package-lock.json, public, README.md, scripts, src, supabase, tsconfig.json, wrangler.jsonc, .env.example, .github, .husky, .nvmrc, .prettierrc.json, .vscode, plus `.gitignore` merged)
**Conflicts (.scaffold siblings)**: CLAUDE.md.scaffold
**.gitignore handling**: append-merged (under `# from 10x-astro-starter`)
**.bootstrap-scaffold cleanup**: deleted

Install notes:

- npm blocked install scripts for `esbuild@0.28.1`, `esbuild@0.28.2` and `workerd@1.20260911.1` (not covered by `allowScripts`). Review with `npm install-scripts ls` and approve if dev/build fails.
- Starter pins Node `22.14.0` in `.nvmrc`; local toolchain is Node `v24.20.0` / npm `12.2.1`.

## Post-scaffold audit

**Tool**: `npm audit --json` (exit 1 — vulnerabilities present; informational)
**Summary**: 0 CRITICAL, 10 HIGH, 2 MODERATE, 1 LOW
**Direct vs transitive**: 0/1/0/1 direct of total 0/10/2/1 — all findings have a fix available via `npm audit fix`.

#### CRITICAL findings

None.

#### HIGH findings

- **wrangler** (direct) — via miniflare. Fix available.
- **@cloudflare/vite-plugin** (transitive) — via miniflare, wrangler. Fix available.
- **miniflare** (transitive) — via sharp, undici. Fix available.
- **brace-expansion** (transitive) — DoS via quadratic expansion / uncontrolled recursion (GHSA-q2hr-2g5m-vwhr, GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p). Fix available.
- **devalue** (transitive) — multiple `uneval`/`stringify` amplification and prototype issues (GHSA-j22f-vq7h-c4qm, GHSA-hx4r-w6wj-j8fg, GHSA-mcm9-63f2-9j32, GHSA-wf3x-273g-mvxv, GHSA-x5rw-q4pp-hg5g, GHSA-4q55-j62x-fr9h, GHSA-r9w8-h9r3-54w4). Fix available.
- **http-cache-semantics** (transitive) — max-stale handling can disclose cross-user cached responses (GHSA-ch52-4w7c-c8xp). Fix available.
- **sharp** (transitive) — librsvg vulnerability CVE-2026-96889 (GHSA-wq5f-xc86-pv6w). Fix available.
- **source-map-js** (transitive) — event-loop DoS via indexed source-map offsets (GHSA-68fv-2mgg-jv7q). Fix available.
- **undici** (transitive) — 10 advisories incl. TLS validation bypass in BalancedPool (GHSA-w293-vg96-wgc3), cookie disclosure via shared caches (GHSA-2jfj-6hjv-fm6j), several DoS issues. Fix available.
- **vite** (transitive) — launch-editor command issues on Windows (GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-587h-7wmj-h5pm), cross-origin script execution via custom middleware (GHSA-9jrq-w75r-8gcw), `server.fs` bypasses (GHSA-rq7h-c2jc-7f22, GHSA-vfpm-58rq-9qcg). Fix available.

#### MODERATE findings

- **fast-uri** (transitive) — inconsistent host case normalization (GHSA-hrr3-gc8f-f4qj). Fix available.
- **smol-toml** (transitive) — quadratic-time `parse()` (GHSA-r4xh-jqrq-34v2). Fix available.

#### LOW / INFO findings

- **astro** (direct) — arbitrary CSS injection in View Transitions (GHSA-mpr7-6m5w-76rw). Fix available.

## Hints recorded but not acted on

| Hint                    | Value                |
| ----------------------- | -------------------- |
| bootstrapper_confidence | first-class          |
| quality_override        | false                |
| path_taken              | standard             |
| self_check_answers      | null                 |
| team_size               | solo                 |
| deployment_target       | cloudflare-pages     |
| ci_provider             | github-actions       |
| ci_default_flow         | auto-deploy-on-merge |
| has_auth                | true                 |
| has_payments            | false                |
| has_realtime            | false                |
| has_ai                  | false                |
| has_background_jobs     | false                |

## Next steps

Next: a future skill will set up agent context (CLAUDE.md, AGENTS.md). For now, your project is scaffolded and verified — happy hacking.

Useful manual steps in the meantime:
- `git init` (if you have not already) to start your own repo history.
- Review any `.scaffold` siblings the conflict policy created and decide which version of each file to keep.
- Address audit findings per your project's risk tolerance — the full breakdown is in this log.
