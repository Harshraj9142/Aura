/**
 * Twitter / X Grievance Escalation Service
 *
 * Handles composition of character-compliant grievance tweets,
 * automated publishing via Twitter API v2, OAuth2 token refresh,
 * and 1-click Web Intent fallback URLs.
 */

import { AirlineId, GrievanceCategory } from "@/lib/grievance/types";
import { AIRLINE_DIRECTORY, AUTHORITY_TWITTER_HANDLES } from "@/lib/grievance/airline-contacts";
import { getStatutoryEntitlement } from "@/lib/grievance/grievance-rules";

export interface GrievanceTweetParams {
  airlineId: AirlineId;
  category: GrievanceCategory;
  pnr?: string;
  flightNumber?: string;
  travelDate?: string;
  maskPnr?: boolean;
}

export interface TweetPublishResult {
  success: boolean;
  tweetId?: string;
  tweetUrl?: string;
  intentUrl: string;
  tweetText: string;
  error?: string;
  diagnostic?: string;
}

/**
 * Build a structured, legally-grounded grievance tweet under 280 characters.
 */
export function buildGrievanceTweet({
  airlineId,
  category,
  pnr = "",
  flightNumber = "",
  travelDate = "",
  maskPnr = false,
}: GrievanceTweetParams): string {
  const airline = AIRLINE_DIRECTORY[airlineId] || AIRLINE_DIRECTORY.indigo;
  const entitlement = getStatutoryEntitlement(airlineId, category);
  const airlineTag = airline.twitterHandle || `@${airline.shortName.replace(/\s+/g, "")}`;

  let displayPnr = pnr.trim().toUpperCase();
  if (displayPnr && maskPnr) {
    displayPnr = displayPnr.length > 3 ? `${displayPnr.slice(0, 3)}***` : `${displayPnr}***`;
  }

  const flightStr = flightNumber.trim() ? ` | Flt ${flightNumber.trim().toUpperCase()}` : "";
  const pnrStr = displayPnr ? ` | PNR: ${displayPnr}` : "";
  const dateStr = travelDate.trim() ? ` (${travelDate.trim()})` : "";

  // Short issue summary derived from category
  let issueSummary = entitlement.headline;
  if (issueSummary.length > 50) {
    issueSummary = issueSummary.slice(0, 47) + "...";
  }

  const baseTweet = `🚨 Escalation via ${AUTHORITY_TWITTER_HANDLES.advocacy}
Carrier: ${airlineTag}${flightStr}${pnrStr}${dateStr}
Issue: ${issueSummary}
Demand: Statutory relief under DGCA CAR Sec 3, Series M, Part IV.
Cc: ${AUTHORITY_TWITTER_HANDLES.dgca} ${AUTHORITY_TWITTER_HANDLES.moca} ${AUTHORITY_TWITTER_HANDLES.airsewa}`;

  if (baseTweet.length <= 280) {
    return baseTweet;
  }

  // Compact fallback if over 280 characters
  return `🚨 Escalation via ${AUTHORITY_TWITTER_HANDLES.advocacy}
${airlineTag}${flightStr}${pnrStr}
Issue: ${issueSummary}
Demand compliance under DGCA CAR M-IV.
Cc: ${AUTHORITY_TWITTER_HANDLES.dgca} ${AUTHORITY_TWITTER_HANDLES.moca}`;
}

/**
 * Generate a 1-click Twitter Web Intent URL
 */
export function buildTwitterIntentUrl(tweetText: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
}

/**
 * Refresh OAuth 2.0 User Access Token if expired
 */
async function refreshAccessToken(): Promise<string | null> {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  const refreshToken = process.env.TWITTER_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        client_id: clientId,
      }),
    });

    if (!res.ok) {
      console.warn("[Twitter] Token refresh failed:", await res.text());
      return null;
    }

    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error("[Twitter] Error refreshing token:", err);
    return null;
  }
}

import { spawn } from "child_process";
import path from "path";
import fs from "fs";

function getAuthToken(): string | undefined {
  if (process.env.TWITTER_AUTH_TOKEN) return process.env.TWITTER_AUTH_TOKEN;
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/^TWITTER_AUTH_TOKEN=["']?([^"'\r\n]+)["']?/m);
      if (match) return match[1];
    }
  } catch {}
  return undefined;
}

function getAdvocacyHandle(): string {
  const envHandle = process.env.NEXT_PUBLIC_TWITTER_HANDLE || process.env.TWITTER_HANDLE;
  if (envHandle) return envHandle.replace("@", "");
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/^(?:NEXT_PUBLIC_TWITTER_HANDLE|TWITTER_HANDLE)=["']?([^"'\r\n]+)["']?/m);
      if (match) return match[1].replace("@", "");
    }
  } catch {}
  return "dmca_test";
}

/**
 * Post tweet headlessly using Playwright and authenticated session cookie
 */
async function postWithPlaywright(tweetText: string): Promise<TweetPublishResult> {
  const intentUrl = buildTwitterIntentUrl(tweetText);
  const authToken = getAuthToken();

  return new Promise((resolve) => {
    let scriptPath = path.resolve(process.cwd(), "../scripts/post_tweet_playwright.py");
    if (!fs.existsSync(scriptPath)) {
      scriptPath = path.resolve(process.cwd(), "scripts/post_tweet_playwright.py");
    }

    const pyProcess = spawn("python", [scriptPath], {
      env: {
        ...process.env,
        TWITTER_AUTH_TOKEN: authToken,
        PYTHONIOENCODING: "utf-8",
        NEXT_PUBLIC_TWITTER_HANDLE: process.env.NEXT_PUBLIC_TWITTER_HANDLE,
      },
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeoutTimer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try {
          pyProcess.kill();
        } catch {}
        resolve({
          success: false,
          intentUrl,
          tweetText,
          error: "Playwright posting timed out after 60s",
          diagnostic: "Ensure your Brave auth_token is valid and active",
        });
      }
    }, 60000);

    pyProcess.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutTimer);
        resolve({
          success: false,
          intentUrl,
          tweetText,
          error: `Failed to spawn Python process: ${err.message}`,
          diagnostic: "Check that Python and Playwright are installed in PATH",
        });
      }
    });

    pyProcess.stdin.write(tweetText);
    pyProcess.stdin.end();

    pyProcess.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    pyProcess.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    pyProcess.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);

      try {
        const trimmed = stdout.trim();
        // Look for json substring in output
        const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.success) {
            resolve({
              success: true,
              tweetId: parsed.tweetId,
              tweetUrl: parsed.tweetUrl,
              intentUrl,
              tweetText,
            });
            return;
          } else {
            resolve({
              success: false,
              intentUrl,
              tweetText,
              error: parsed.error || "Playwright posting failed",
              diagnostic: "Verify that your auth_token is active in Brave",
            });
            return;
          }
        }
      } catch (e) {
        // parsing error handled below
      }

      resolve({
        success: false,
        intentUrl,
        tweetText,
        error: stderr || stdout || "Failed to post via Playwright",
        diagnostic: "Check Python Playwright environment or cookie validity",
      });
    });
  });
}

/**
 * Post tweet directly to Twitter API v2 or via Playwright
 */
export async function publishToTwitter(tweetText: string): Promise<TweetPublishResult> {
  const intentUrl = buildTwitterIntentUrl(tweetText);
  const authToken = getAuthToken();

  // 1. If TWITTER_AUTH_TOKEN is configured, use the 100% Free Playwright poster
  if (authToken) {
    return postWithPlaywright(tweetText);
  }

  let accessToken = process.env.TWITTER_ACCESS_TOKEN;

  if (!accessToken) {
    return {
      success: false,
      intentUrl,
      tweetText,
      error: "Missing Twitter credentials in server environment",
      diagnostic: "Add TWITTER_AUTH_TOKEN or TWITTER_ACCESS_TOKEN to web/.env.local",
    };
  }

  try {
    let response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: tweetText }),
    });

    // If 401 Unauthorized, attempt token refresh once
    if (response.status === 401) {
      console.log("[Twitter] Access token expired, attempting refresh...");
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        accessToken = newAccessToken;
        response = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: tweetText }),
        });
      }
    }

    const resJson = await response.json();

    if (response.ok && resJson.data?.id) {
      const tweetId = resJson.data.id;
      return {
        success: true,
        tweetId,
        tweetUrl: `https://x.com/${getAdvocacyHandle()}/status/${tweetId}`,
        intentUrl,
        tweetText,
      };
    }

    // Handle known developer portal enrollment / client errors
    let diagnostic = "Check Twitter Developer Portal settings.";
    if (resJson.reason === "client-not-enrolled" || resJson.detail?.includes("attached to a Project")) {
      diagnostic =
        "Your Twitter Developer App needs to be attached to a Project in developer.x.com. In Developer Portal, move your App inside a Project and subscribe to the Free tier.";
    } else if (resJson.status === 403) {
      diagnostic = "Check that your App permissions are set to 'Read and Write' in User authentication settings.";
    }

    return {
      success: false,
      intentUrl,
      tweetText,
      error: resJson.detail || resJson.title || "Twitter API rejected the tweet",
      diagnostic,
    };
  } catch (err: any) {
    return {
      success: false,
      intentUrl,
      tweetText,
      error: err.message || "Failed to communicate with Twitter API",
      diagnostic: "Network or configuration error connecting to api.twitter.com",
    };
  }
}
