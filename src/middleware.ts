import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Defensive: catch auth ?code= arriving at root (Supabase redirect URL allowlist fallback)
  // When Supabase can't match redirect_to against the allowlist, it redirects to site URL root with ?code=
  if (pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const code = request.nextUrl.searchParams.get("code")!;
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    // Preserve the code param; default next to /redefinir-senha for recovery flows
    url.searchParams.set("code", code);
    if (!url.searchParams.has("next")) {
      url.searchParams.set("next", "/redefinir-senha");
    }
    return NextResponse.redirect(url);
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["ADMIN", "AGENT"].includes(profile.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Protect driver routes
  if (pathname.startsWith("/motorista")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["ADMIN", "DRIVER"].includes(profile.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Protect client panel routes (require any auth)
  if (pathname.startsWith("/painel")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect completar-cadastro (requires active session)
  if (pathname.startsWith("/completar-cadastro")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // Redirect logged-in users away from auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/cadastro")) {
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      let targetUrl = new URL("/", request.url);
      if (profile?.role === "ADMIN" || profile?.role === "AGENT") {
        targetUrl = new URL("/admin", request.url);
      } else if (profile?.role === "DRIVER") {
        targetUrl = new URL("/motorista", request.url);
      } else {
        targetUrl = new URL("/painel", request.url); // Default for CLIENT should ideally be /painel, not /
      }

      // Preserve query params like success or error
      const success = request.nextUrl.searchParams.get("success");
      const error = request.nextUrl.searchParams.get("error");
      if (success) targetUrl.searchParams.set("success", success);
      if (error) targetUrl.searchParams.set("error", error);

      return NextResponse.redirect(targetUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
