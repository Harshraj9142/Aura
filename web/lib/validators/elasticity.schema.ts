/**
 * APIx Web — Elasticity Query Param Validator
 *
 * Zod schema for GET /api/elasticity search params.
 */

import { z } from "zod";

export const elasticityQuerySchema = z.object({
  origin: z
    .string()
    .length(3)
    .toUpperCase()
    .describe("Origin IATA code (required)"),

  destination: z
    .string()
    .length(3)
    .toUpperCase()
    .describe("Destination IATA code (required)"),
});

export type ElasticityQueryInput = z.infer<typeof elasticityQuerySchema>;
