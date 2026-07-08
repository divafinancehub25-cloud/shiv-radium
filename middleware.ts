import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// STICKO deployment: send the homepage to the STICKO landing page.
// Shiv Radium files are untouched — this only redirects the exact "/" path.
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/sticko", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
