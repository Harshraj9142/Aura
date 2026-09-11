/**
 * APIx Web — Fares Query Param Validator
 *
 * Zod schema for GET /api/fares search params.
 */

import { z } from "zod";

export const faresQuerySchema = z.object({
  origin: z
    .string()
    .length(3)
    .toUpperCase()
    .optional()
    .describe("Origin IATA code (e.g. DEL)"),

  destination: z
    .string()
    .length(3)
    .toUpperCase()
    .optional()
    .describe("Destination IATA code (e.g. BOM)"),

  source: z
    .string()
    .optional()
    .describe("Source name (e.g. indigo, makemytrip)"),

  sourceType: z
    .enum(["airline", "ota"])
    .optional()
    .describe("Filter by source type"),

  isOutlier: z
    .preprocess(
      (v) => (v === "true" ? true : v === "false" ? false : undefined),
      z.boolean().optional()
    )
    .describe("Filter by outlier status"),

  advanceDays: z.coerce
    .number()
    .int()
    .min(0)
    .max(90)
    .optional()
    .describe("Exact advance purchase days"),

  minAdvanceDays: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Minimum advance purchase days"),

  maxAdvanceDays: z.coerce
    .number()
    .int()
    .max(90)
    .optional()
    .describe("Maximum advance purchase days"),

  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .optional()
    .describe("Filter travel dates from (inclusive)"),

  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .optional()
    .describe("Filter travel dates to (inclusive)"),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1)
    .describe("Page number"),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(200)
    .default(50)
    .describe("Results per page (max 200)"),

  sortBy: z
    .enum(["travel_date", "total_fare", "scraped_at"])
    .default("scraped_at")
    .describe("Sort field"),

  sortOrder: z
    .enum(["asc", "desc"])
    .default("desc")
    .describe("Sort direction"),
});

export type FaresQueryInput = z.infer<typeof faresQuerySchema>;
