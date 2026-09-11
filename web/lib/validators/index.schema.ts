/**
 * APIx Web — Index Query Param Validator
 *
 * Zod schema for GET /api/index search params.
 */

import { z } from "zod";

export const indexQuerySchema = z.object({
  origin: z
    .string()
    .length(3)
    .toUpperCase()
    .optional()
    .describe("Origin IATA code"),

  destination: z
    .string()
    .length(3)
    .toUpperCase()
    .optional()
    .describe("Destination IATA code"),

  frequency: z
    .enum(["daily", "weekly", "monthly"])
    .describe("Index frequency"),

  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .optional()
    .describe("Date range start (inclusive)"),

  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .optional()
    .describe("Date range end (inclusive)"),
});

export type IndexQueryInput = z.infer<typeof indexQuerySchema>;
