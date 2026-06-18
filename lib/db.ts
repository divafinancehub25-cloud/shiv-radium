import { neon } from "@neondatabase/serverless";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

function createClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is missing");
  }
  const sql = neon(databaseUrl);
  const adapter = new PrismaNeonHTTP(sql);
  return new PrismaClient({ adapter });
}

let _db: PrismaClient | undefined;

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop: string) {
    if (!_db) _db = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (_db as any)[prop];
  },
});
