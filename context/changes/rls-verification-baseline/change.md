---
change_id: rls-verification-baseline
title: RLS verification baseline (F-01)
status: implementing
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Notes

F-01 z @context/foundation/roadmap.md


### Open: Cloudflare Workers Builds fails on non-production branches (tracked as plan.md row 3.7)

Found on PR #1 (2026-11-20). Not caused by F-01; every PR branch hits it. `main` builds pass.

- Build step succeeds; the deploy step fails: `npx wrangler preview` returns `binding SESSION of type kv_namespace must have a namespace_id specified [code: 10021]`.
- The Astro Cloudflare adapter auto-adds a `SESSION` KV binding; a preview deployment needs it to point at a real KV namespace. The app uses Supabase cookie auth, so it likely does not need Astro sessions at all.
- Fix options, in order of effort:
  1. Cloudflare dashboard > Workers & Pages > lokalsi > Settings > Builds > Build configuration: set "Non-production branch deploy command" to `npx wrangler versions upload`, then retry the build. Unverified that it handles the unprovisioned KV binding.
  2. Turn off non-production branch builds in the same settings (GitHub `ci` and `smoke` already cover PRs).
  3. Give `SESSION` a real KV namespace id in `wrangler.jsonc`, or stop the adapter creating the binding (check adapter docs first).
- Evidence: Cloudflare build log of build 816520f8-f4e9-4f81-9be3-280c9a124b53 (was saved in the repo root, untracked).
