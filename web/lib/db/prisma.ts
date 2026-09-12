/**
 * APIx Web — Prisma Client Singleton
 *
 * Standard Next.js pattern to avoid exhausting database connections
 * in development (where Turbopack and hot-reloading create new module instances).
 */

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
