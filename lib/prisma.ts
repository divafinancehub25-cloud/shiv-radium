import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// WebSocket mode — required so Prisma transactions work (HTTP mode does not
// support them, which caused deposits/withdrawals/register to hang).
neonConfig.webSocketConstructor = ws;
// Route plain (non-transactional) queries over fast HTTP fetch; only real
// transactions open a WebSocket. Avoids "Control plane request failed" and
// connection churn on query-heavy pages like analytics.
neonConfig.poolQueryViaFetch = true;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
