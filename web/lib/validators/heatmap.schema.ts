/**
 * APIx Web — Heatmap Query Param Validator
 *
 * Zod schema for GET /api/heatmap search params.
 */

import { z } from "zod";

export const heatmapQuerySchema = z.object({
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .optional()
    .describe("Date range start (default: 30 days ago)"),

  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .optional()
    .describe("Date range end (default: today)"),
});

export type HeatmapQueryInput = z.infer<typeof heatmapQuerySchema>;
