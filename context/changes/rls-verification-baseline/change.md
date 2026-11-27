---
change_id: rls-verification-baseline
title: RLS verification baseline (F-01)
status: implementing
created: 2026-11-20
updated: 2026-11-27
archived_at: null
---

## Notes

F-01 z @context/foundation/roadmap.md


### Resolved (2026-11-27): Cloudflare Workers Builds fails on non-production branches (tracked as plan.md row 3.7)

Found on PR #1 (2026-11-20). Not caused by F-01; every PR branch hits it. `main` builds pass.

- Build step succeeds; the deploy step fails: `npx wrangler preview` returns `binding SESSION of type kv_namespace must have a namespace_id specified [code: 10021]`.
- The Astro Cloudflare adapter auto-adds a `SESSION` KV binding; a preview deployment needs it to point at a real KV namespace. The app uses Supabase cookie auth, so it likely does not need Astro sessions at all.
- Fix options, in order of effort:
  1. Cloudflare dashboard > Workers & Pages > lokalsi > Settings > Builds > Build configuration: set "Non-production branch deploy command" to `npx wrangler versions upload`, then retry the build. Unverified that it handles the unprovisioned KV binding.
  2. Turn off non-production branch builds in the same settings (GitHub `ci` and `smoke` already cover PRs).
  3. Give `SESSION` a real KV namespace id in `wrangler.jsonc`, or stop the adapter creating the binding (check adapter docs first).
- Evidence: Cloudflare build log of build 816520f8-f4e9-4f81-9be3-280c9a124b53 (was saved in the repo root, untracked).
- **Resolution:** option 3, `session: false` in `astro.config.mjs` (commit 7955fee). The app does not use Astro sessions, so the adapter no longer injects the `SESSION` KV binding and `kv_namespaces` in the generated `dist/server/wrangler.json` is empty. The Workers Builds check passes on the branch.
- Option 1 did not work: "Preview Base" settings in the dashboard did not change the branch build's deploy command, which stayed `npx wrangler preview` (the current Workers Builds default for preview builds). Previews Base has its own empty Bindings and does not inherit Production's `SESSION` KV namespace.
- Follow-up: the next `main` deploy drops `SESSION`, which orphans the KV namespace auto-provisioned earlier. Delete it in the dashboard after confirming `main` is healthy.
