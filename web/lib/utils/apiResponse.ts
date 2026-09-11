/**
 * APIx Web — API Response Helpers
 *
 * Centralized envelope builders so every Route Handler returns
 * a consistent JSON shape:
 *
 *   Success: { success: true, data: T, meta?: PaginationMeta }
 *   Error:   { success: false, error: { message, code, fields? } }
 */

import { NextResponse } from "next/server";
import type { PaginationMeta } from "@/types/fare";

/**
 * Build a success response with the standard envelope.
 */
export function ok<T>(data: T, meta?: PaginationMeta): NextResponse {
  return NextResponse.json(
    { success: true, data, ...(meta ? { meta } : {}) },
    { status: 200 }
  );
}

/**
 * Build an error response with the standard envelope.
 */
export function fail(
  message: string,
  code: string,
  status: number = 500,
  fields?: Record<string, string[]>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: { message, code, ...(fields ? { fields } : {}) },
    },
    { status }
  );
}

/**
 * Build a 400 validation error from Zod issues.
 */
export function validationError(issues: any[]): NextResponse {
  const fields: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = Array.isArray(issue.path) ? issue.path.join(".") : "_root";
    if (!fields[key]) fields[key] = [];
    fields[key].push(issue.message);
  }
  return fail("Validation failed", "VALIDATION_ERROR", 400, fields);
}

/**
 * Build a 404 response.
 */
export function notFound(message: string = "Resource not found"): NextResponse {
  return fail(message, "NOT_FOUND", 404);
}
