---
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
---

## Why this stack

Lokalsi is a login-only web app for about a hundred users in one neighbourhood, built solo after hours in 10 weeks by a Python developer new to web development. The 10x Astro Starter is the vetted default for a TypeScript web app and covers the must-haves that are hardest to get right alone: email-and-password accounts with persistent sessions, a PostgreSQL database, and deployment, all pre-wired. TypeScript with Zod schemas gives an AI agent explicit contracts to reason from, which compensates for the builder's unfamiliarity with the ecosystem. Known gaps to plan for: the interactive neighbourhood map is not part of the starter and must be added during implementation; database access rules must be configured early so that only an event's author can cancel it; Polish-only interface text and date formats need setting up from the start. Deployment defaults to Cloudflare Pages (chosen as the starter default, revisitable after scaffolding), with GitHub Actions auto-deploying on merge.
