import { defineMiddleware } from "astro:middleware";
import { createClient } from "@/lib/supabase";

// Default-deny: anything not matched here requires a session. Add public routes deliberately.
// Note: "/auth/" is a prefix, so every page added under /auth/ is public by default.
const PUBLIC_PATH_PREFIXES = ["/auth/", "/_astro/"];
const PUBLIC_PATHS_EXACT = ["/api/auth/signin", "/api/auth/signup", "/api/auth/signout", "/favicon.png"];
const SIGNED_OUT_ONLY_PATHS = ["/auth/signin", "/auth/signup"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS_EXACT.includes(pathname) || PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createClient(context.request.headers, context.cookies);

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    context.locals.user = user ?? null;
  } else {
    context.locals.user = null;
  }

  const { pathname } = context.url;

  if (!context.locals.user) {
    if (!isPublicPath(pathname)) {
      if (pathname.startsWith("/api/")) {
        return new Response(null, { status: 401 });
      }
      return context.redirect("/auth/signin");
    }
  } else if (SIGNED_OUT_ONLY_PATHS.includes(pathname)) {
    return context.redirect("/");
  }

  return next();
});
