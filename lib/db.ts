import { neon } from "@neondatabase/serverless";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

let _db: PrismaClient | undefined;

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = neon(url);
  const adapter = new PrismaNeonHttp(sql);
  return new PrismaClient({ adapter });
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop: string) {
    if (!_db) _db = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (_db as any)[prop];
  },
});
