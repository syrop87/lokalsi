// Starts the dev server against the LOCAL Supabase: CLOUDFLARE_ENV=local makes Wrangler read
// .dev.vars.local instead of .dev.vars (which points at the hosted project).
// Create .dev.vars.local from `npx supabase status -o env` (SUPABASE_URL=API_URL, SUPABASE_KEY=ANON_KEY).
import { spawn } from "node:child_process";

const child = spawn("npx", ["astro", "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, CLOUDFLARE_ENV: "local" },
});
child.on("exit", (code) => process.exit(code ?? 0));
