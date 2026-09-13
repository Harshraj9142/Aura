/**
 * Pure client-safe Twitter formatting utilities
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
