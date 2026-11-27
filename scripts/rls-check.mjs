// RLS check: proves the author-only rules on public.profiles with two real users.
// Zero dependencies on purpose. Works against local, CI and hosted Supabase:
//   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_KEY=<anon key> node scripts/rls-check.mjs
// Hosted runs leave two `rls-check-*` users in auth: delete them from the Supabase console afterwards.

import { randomUUID } from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("SUPABASE_URL and SUPABASE_KEY (anon key) must be set.");
  process.exit(1);
}

const password = "Rls-Check-Passw0rd!";
const stamp = Date.now();

async function signUp(label) {
  const email = `rls-check-${stamp}-${label}@example.com`;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) {
    throw new Error(
      `sign-up of user ${label} failed (HTTP ${response.status}); is email confirmation off? ${JSON.stringify(body)}`,
    );
  }
  return { id: body.user.id, token: body.access_token };
}

// token = undefined means an anonymous request (anon key only).
async function profiles(token, query, { method = "GET", body } = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles${query}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  return { status: response.status, ok: response.ok, json, rows: Array.isArray(json) ? json : [] };
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

const steps = [];
const step = (name, fn) => steps.push([name, fn]);

let a;
let b;

step("two users sign up and each gets a profile row", async () => {
  a = await signUp("a");
  b = await signUp("b");
  const res = await profiles(a.token, `?id=in.(${a.id},${b.id})&select=id`);
  expect(res.ok && res.rows.length === 2, `expected both profile rows (trigger), got ${JSON.stringify(res.json)}`);
});

step("a logged-in user can read every profile", async () => {
  const res = await profiles(a.token, `?id=in.(${a.id},${b.id})&select=id`);
  const ids = res.rows.map((r) => r.id);
  expect(ids.includes(a.id) && ids.includes(b.id), `A should see A and B, saw ${JSON.stringify(ids)}`);
});

step("user A can update their own profile", async () => {
  const res = await profiles(a.token, `?id=eq.${a.id}`, { method: "PATCH", body: { display_name: "A renamed" } });
  expect(
    res.ok && res.rows.length === 1 && res.rows[0].display_name === "A renamed",
    `own update failed: ${JSON.stringify(res.json)}`,
  );
});

step("user A cannot update user B's profile", async () => {
  const res = await profiles(a.token, `?id=eq.${b.id}`, { method: "PATCH", body: { display_name: "hijacked" } });
  expect(res.rows.length === 0, `A changed B's row: ${JSON.stringify(res.json)}`);
  const check = await profiles(b.token, `?id=eq.${b.id}&select=display_name`);
  expect(check.rows.length === 1 && check.rows[0].display_name !== "hijacked", "B's row was modified");
});

step("user A cannot hand their row's id over to B", async () => {
  const res = await profiles(a.token, `?id=eq.${a.id}`, { method: "PATCH", body: { id: b.id } });
  expect(!res.ok || res.rows.length === 0, `id change was accepted: ${JSON.stringify(res.json)}`);
  const check = await profiles(a.token, `?id=eq.${a.id}&select=id`);
  expect(check.rows.length === 1, "A's row id changed");
});

step("nobody can delete profiles through the API", async () => {
  const other = await profiles(a.token, `?id=eq.${b.id}`, { method: "DELETE" });
  expect(other.rows.length === 0, `A deleted B's row: ${JSON.stringify(other.json)}`);
  const own = await profiles(a.token, `?id=eq.${a.id}`, { method: "DELETE" });
  expect(own.rows.length === 0, `A deleted their own row: ${JSON.stringify(own.json)}`);
  const check = await profiles(a.token, `?id=in.(${a.id},${b.id})&select=id`);
  expect(check.rows.length === 2, "a profile row disappeared");
});

step("nobody can insert profiles through the API", async () => {
  const res = await profiles(a.token, "", { method: "POST", body: { id: randomUUID() } });
  expect(
    !res.ok && res.json?.code === "42501",
    `insert was not denied by policy: HTTP ${res.status} ${JSON.stringify(res.json)}`,
  );
});

step("an anonymous visitor sees and changes nothing", async () => {
  const read = await profiles(undefined, `?id=in.(${a.id},${b.id})&select=id`);
  expect(!read.ok || read.rows.length === 0, `anonymous read leaked rows: ${JSON.stringify(read.json)}`);
  const write = await profiles(undefined, `?id=eq.${a.id}`, { method: "PATCH", body: { display_name: "anon" } });
  expect(!write.ok || write.rows.length === 0, `anonymous update changed rows: ${JSON.stringify(write.json)}`);
});

for (const [name, fn] of steps) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}\n     ${error.message}`);
    process.exit(1);
  }
}

console.log("RLS check passed");
