// Signed admin session token — HMAC-SHA256 so the cookie can't be forged.
// Works on both Node and Edge (middleware) via Web Crypto.

const enc = new TextEncoder();

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.RAZORPAY_KEY_SECRET || "shiv-radium-fallback-secret-change-me";
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Buffer.from(new Uint8Array(sig)).toString("base64url");
}

// token = "<userId>.<hmac(userId)>"
export async function signAdminSession(userId: string): Promise<string> {
  return `${userId}.${await hmac(userId)}`;
}

export async function verifyAdminSession(token: string | undefined | null): Promise<string | null> {
  if (!token || !token.includes(".")) return null;
  const idx = token.lastIndexOf(".");
  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!userId || !sig) return null;
  const expected = await hmac(userId);
  // constant-time-ish compare
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? userId : null;
}
