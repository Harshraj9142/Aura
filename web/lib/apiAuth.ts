import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Validates access to API routes.
 * 
 * First checks for an API Key via the 'Authorization: Bearer <key>' or 'x-api-key: <key>' header.
 * If found, verifies the key against the database and ensures the user has GOVERNMENT role.
 * 
 * If no API key is provided, falls back to checking the active NextAuth session.
 * 
 * @returns {Promise<any | null>} Returns the User object if authorized, otherwise null.
 */
export async function verifyApiAccess(request: NextRequest) {
  // 1. Try to authenticate via API Key
  const authHeader = request.headers.get("authorization");
  const apiKeyHeader = request.headers.get("x-api-key");
  
  let keyToVerify: string | null = null;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    keyToVerify = authHeader.substring(7);
  } else if (apiKeyHeader) {
    keyToVerify = apiKeyHeader;
  }

  if (keyToVerify) {
    // Look up the API key in the database
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: keyToVerify },
      include: { user: true },
    });

    if (apiKeyRecord && apiKeyRecord.user.role === "GOVERNMENT") {
      return apiKeyRecord.user; // Authorized via API Key
    }
    
    // If key provided but invalid/unauthorized, we reject immediately 
    // rather than falling back to session (secure by default)
    return null; 
  }

  // 2. Try to authenticate via NextAuth session
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).role === "GOVERNMENT") {
      return session.user; // Authorized via Session
    }
  } catch (error) {
    console.error("Session verification error:", error);
  }

  return null; // Unauthorized
}
