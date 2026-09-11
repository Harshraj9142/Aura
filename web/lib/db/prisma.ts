/**
 * APIx Web — Prisma Client Singleton
 *
 * Standard Next.js pattern to avoid exhausting database connections
 * in development (where hot-reloading creates new module instances).
 *
 * The Prisma schema is generated via `prisma db pull` from the
 * Python scraper's PostgreSQL database — never use `prisma migrate`.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
