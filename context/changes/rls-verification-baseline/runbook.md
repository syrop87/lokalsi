# Runbook: migrations and the RLS check on the hosted Supabase project

Use this after every migration that adds or changes tables or RLS policies. `wrangler rollback` reverts Worker code only: schema and policy changes are never rolled back automatically, so a broken policy stays live until a fix is pushed. A human approves every `db push` (see `context/foundation/infrastructure.md`).

## 1. Prove it locally first

```
npx supabase db reset          # needs Docker; applies supabase/migrations/ from scratch
npx supabase status -o env     # note API_URL and ANON_KEY
SUPABASE_URL=<API_URL> SUPABASE_KEY=<ANON_KEY> npm run rls-check
```

CI runs the same check on every push and pull request (`smoke` job). Do not push to hosted while it is red.

## 2. Link and push to hosted

You need the project ref (Supabase dashboard > Project Settings > General) and the database password.

```
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push --dry-run     # read the list of migrations it would apply
npx supabase db push
```

`link` is needed once per machine. `--dry-run` shows what will run; only continue if it lists exactly the migrations you expect.

## 3. Run the check against hosted

Use the hosted project URL and its anon (publishable) key from Project Settings > API:

```
SUPABASE_URL=https://<ref>.supabase.co SUPABASE_KEY=<anon key> npm run rls-check
```

Expect eight `ok` lines and `RLS check passed`. The script signs up two users, so hosted email confirmation must be off (it is for v1); if sign-up fails with a message about confirmation, the script says so.

Also confirm anonymous access is closed:

```
curl -s "https://<ref>.supabase.co/rest/v1/profiles?select=id" -H "apikey: <anon key>"
```

Expected: `[]`.

## 4. Clean up

Each hosted run leaves two users named `rls-check-<timestamp>-a@example.com` and `-b@`. Delete them in the dashboard under Authentication > Users; their `profiles` rows are removed by cascade.

## If the check fails on hosted

The new policy is live and wrong. Fix forward with a new migration and `db push` again, or run the rollback SQL from the comment block at the top of the offending migration in the Supabase SQL editor.
