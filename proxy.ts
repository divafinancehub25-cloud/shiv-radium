import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const role = session?.user?.role;

  // Protect admin routes
  if (nextUrl.pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login?callbackUrl=/admin/dashboard", nextUrl));
    }
    if (!["SUPER_ADMIN", "ADMIN"].includes(role ?? "")) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  // Protect driver portal
  if (nextUrl.pathname.startsWith("/driver")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (role !== "DRIVER") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  // Redirect logged-in users away from login
  if (nextUrl.pathname === "/login" && isLoggedIn) {
    if (["SUPER_ADMIN", "ADMIN"].includes(role ?? "")) {
      return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
    }
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // ── DIVA Growth Capital routes ──────────────────────────────────────────────
  const divaPortalPaths = ["/diva-app/dashboard", "/diva-app/profile", "/diva-app/kyc", "/diva-app/settings", "/diva-app/deposit", "/diva-app/withdraw", "/diva-app/portfolio", "/diva-app/forecasting"];
  if (divaPortalPaths.some((p) => nextUrl.pathname.startsWith(p))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/diva-app/login?callbackUrl=${nextUrl.pathname}`, nextUrl));
    }
  }

  if (nextUrl.pathname.startsWith("/diva-app-admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/diva-app/login?callbackUrl=/diva-app-admin/dashboard", nextUrl));
    }
    if (!["SUPER_ADMIN", "ADMIN"].includes(role ?? "")) {
      return NextResponse.redirect(new URL("/diva-app/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/driver/:path*", "/login", "/diva-app/:path*", "/diva-app-admin/:path*"],
};
