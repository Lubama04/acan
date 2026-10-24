import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { buildCsp, SECURITY_HEADERS } from "@/lib/security/csp";

// Probes for files/CMSs that do not exist here: answer 404 early without rendering.
const BLOCKED_PATHS = /^\/(?:\.env|\.git|wp-admin|wp-login\.php|xmlrpc\.php|phpmyadmin|server-status|\.DS_Store)/i;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (BLOCKED_PATHS.test(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp({
    nonce,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    adsense: Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID),
    dev: process.env.NODE_ENV === "development",
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  // Admin area: refresh the Supabase session cookie. Authorisation is NOT decided here:
  // every admin page, action and query re-checks it server-side (and RLS enforces it in the DB).
  if (pathname.startsWith("/admin") && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll(cookiesToSet) {
            for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
            response = NextResponse.next({ request: { headers: requestHeaders } });
            for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          },
        },
      },
    );
    await supabase.auth.getUser();
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  response.headers.set("Content-Security-Policy", csp);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) response.headers.set(k, v);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|favicon.svg|icon.svg|apple-touch-icon.png|icon-|brand/|site.webmanifest).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
