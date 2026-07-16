import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// STICKO deployment (STICKO_DEPLOY=1): send the homepage to the STICKO landing page.
// Shiv Radium deployment (no env var) keeps its own homepage.
export function middleware(request: NextRequest) {
  if (process.env.STICKO_DEPLOY === "1" && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/sticko", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
