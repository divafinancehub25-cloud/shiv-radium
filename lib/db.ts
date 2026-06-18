import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

let _client: PrismaClient | null = null;

function getClient(): PrismaClient {
  if (_client) return _client;
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set in environment variables");
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaNeon(pool);
  _client = new PrismaClient({ adapter });
  return _client;
}

// Lazy proxy — env vars are read at query time, not at module load time
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getClient() as any)[prop];
  },
});
