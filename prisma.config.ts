import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx --env-file=.env prisma/seed.ts",
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  datasource: {
    url: process.env.DATABASE_URL!,
  } as any,
});
