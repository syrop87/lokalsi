// Smoke test: proves the built app, the Cloudflare adapter and the Supabase auth flow still work together.
// Zero dependencies on purpose. Run against a live server: BASE_URL=http://localhost:4321 node scripts/smoke.mjs

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4321";
const email = `smoke-${Date.now()}@example.com`;
const password = "Smoke-Test-Passw0rd!";
const jar = new Map();

// Safety guard: never sign up smoke users in a non-local Supabase by accident.
// A script cannot see which Supabase the server uses, so this reads the config file the server would load:
// .dev.vars.local with `--local` (server started via `npm run dev:local`), otherwise .dev.vars.
// Skipped for a non-localhost BASE_URL. Override deliberately with SMOKE_ALLOW_HOSTED=1.
if (/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE_URL) && process.env.SMOKE_ALLOW_HOSTED !== "1") {
  const file = process.argv.includes("--local") ? ".dev.vars.local" : ".dev.vars";
  let url = "";
  try {
    const { readFileSync } = await import("node:fs");
    url = /^SUPABASE_URL=(.*)$/m.exec(readFileSync(file, "utf8"))?.[1].trim() ?? "";
  } catch {
    // no config file (e.g. env-only setup): nothing to check
  }
  if (url && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url)) {
    console.error(
      `Refusing to run: ${file} points SUPABASE_URL at a non-local host (${url.split("//")[1]?.split("/")[0] ?? url}).`,
    );
    console.error("Use `npm run dev:local` + `npm run smoke:local`, or set SMOKE_ALLOW_HOSTED=1 to allow it.");
    process.exit(2);
  }
}

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function storeCookies(response) {
  for (const raw of response.headers.getSetCookie()) {
    const [pair, ...attrs] = raw.split(";");
    const [name, ...rest] = pair.split("=");
    const expired = attrs.some((a) => /max-age=0/i.test(a.trim()));
    if (expired) jar.delete(name.trim());
    else jar.set(name.trim(), rest.join("="));
  }
}

async function request(path, { method = "GET", form } = {}) {
  const response = await fetch(BASE_URL + path, {
    method,
    redirect: "manual",
    headers: {
      Cookie: cookieHeader(),
      Origin: BASE_URL,
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  storeCookies(response);
  return { status: response.status, location: response.headers.get("location") ?? "" };
}

const steps = [
  ["home redirects anonymous user", () => request("/"), { status: 302, location: "/auth/signin" }],
  ["sample api route rejects anonymous user", () => request("/api/nonexistent-probe"), { status: 401 }],
  [
    "signup creates account",
    () => request("/api/auth/signup", { method: "POST", form: { email, password } }),
    { status: 302, location: "/auth/confirm-email" },
  ],
  [
    "signin rejects wrong password",
    () => request("/api/auth/signin", { method: "POST", form: { email, password: "wrong" } }),
    { status: 302, location: "/auth/signin?error=", error: "Nieprawidłowy e-mail lub hasło." },
  ],
  [
    "signin accepts correct password",
    () => request("/api/auth/signin", { method: "POST", form: { email, password } }),
    { status: 302, location: "/" },
  ],
  ["signed-in user bounces off signin page", () => request("/auth/signin"), { status: 302, location: "/" }],
  ["home renders for signed-in user", () => request("/"), { status: 200 }],
  ["signout clears session", () => request("/api/auth/signout", { method: "POST" }), { status: 302, location: "/" }],
  ["home redirects after signout", () => request("/"), { status: 302, location: "/auth/signin" }],
];

let failed = 0;
for (const [name, run, expected] of steps) {
  const actual = await run();
  const actualError = new URLSearchParams(actual.location.split("?")[1] ?? "").get("error");
  const ok =
    actual.status === expected.status &&
    (expected.location === undefined || actual.location.startsWith(expected.location)) &&
    (expected.error === undefined || actualError === expected.error);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  -> ${actual.status} ${actual.location}`);
  if (!ok) {
    failed++;
    console.log(`      expected ${expected.status} ${expected.location ?? ""}`);
    if (expected.error !== undefined)
      console.log(`      expected error "${expected.error}", got "${actualError ?? ""}"`);
  }
}

console.log(failed ? `\n${failed} step(s) failed` : "\nAll smoke steps passed");
process.exit(failed ? 1 : 0);
