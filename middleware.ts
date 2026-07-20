import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSession } from "@/lib/adminSession";

// Admin panel + admin APIs need a valid signed session, else 401 / redirect to login.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // STICKO deployment homepage redirect
  if (process.env.STICKO_DEPLOY === "1" && pathname === "/") {
    return NextResponse.redirect(new URL("/sticko", request.url));
  }

  // Protect admin pages and admin APIs (login page stays open;
  // /api/admin/upload stays open — customers use it for photo/review uploads)
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi = pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/upload");
  if (isAdminPage || isAdminApi) {
    const token = request.cookies.get("admin_session")?.value;
    const userId = await verifyAdminSession(token);
    if (!userId) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/api/admin/:path*"],
};
