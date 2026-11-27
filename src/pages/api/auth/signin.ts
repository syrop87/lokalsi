import type { APIRoute } from "astro";
import { createClient } from "@/lib/supabase";
import { polishAuthError, INVALID_FORM_MESSAGE, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/auth-errors";
import { readCredentials } from "@/lib/auth-form";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const credentials = await readCredentials(context.request);
  if (!credentials) {
    return context.redirect(`/auth/signin?error=${encodeURIComponent(INVALID_FORM_MESSAGE)}`);
  }
  const { email, password } = credentials;

  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) {
    return context.redirect(`/auth/signin?error=${encodeURIComponent(SUPABASE_NOT_CONFIGURED_MESSAGE)}`);
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return context.redirect(`/auth/signin?error=${encodeURIComponent(polishAuthError(error, "signin"))}`);
  }

  return context.redirect("/");
};
