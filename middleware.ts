import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Admin-session verification inlined here (Web Crypto only) so the Edge
// middleware bundle has no cross-module import to flag as "unsupported".
const enc = new TextEncoder();
function adminSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.RAZORPAY_KEY_SECRET || "shiv-radium-fallback-secret-change-me";
}
function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function adminHmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(adminSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return toBase64Url(new Uint8Array(sig));
}
async function verifyAdminSession(token: string | undefined | null): Promise<string | null> {
  if (!token || !token.includes(".")) return null;
  const idx = token.lastIndexOf(".");
  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!userId || !sig) return null;
  const expected = await adminHmac(userId);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? userId : null;
}

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
