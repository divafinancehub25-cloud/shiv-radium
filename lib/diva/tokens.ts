import crypto from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET ?? "diva-secret-fallback";

export function generateSecureToken(length = 48): string {
  return crypto.randomBytes(length).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHmac("sha256", SECRET).update(token).digest("hex");
}
