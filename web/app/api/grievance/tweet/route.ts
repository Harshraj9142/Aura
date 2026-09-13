import { NextRequest, NextResponse } from "next/server";
import {
  buildGrievanceTweet,
  buildTwitterIntentUrl,
} from "@/lib/grievance/twitter-format";
import { publishToTwitter } from "@/lib/services/twitter.service";
import { AirlineId, GrievanceCategory } from "@/lib/grievance/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const airlineId = (searchParams.get("airlineId") || "indigo") as AirlineId;
  const category = (searchParams.get("category") || "delay") as GrievanceCategory;
  const pnr = searchParams.get("pnr") || "";
  const flightNumber = searchParams.get("flightNumber") || "";
  const travelDate = searchParams.get("travelDate") || "";
  const maskPnr = searchParams.get("maskPnr") === "true";

  const tweetText = buildGrievanceTweet({
    airlineId,
    category,
    pnr,
    flightNumber,
    travelDate,
    maskPnr,
  });

  const intentUrl = buildTwitterIntentUrl(tweetText);

  return NextResponse.json({
    success: true,
    tweetText,
    charCount: tweetText.length,
    intentUrl,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      airlineId,
      category,
      pnr,
      flightNumber,
      travelDate,
      maskPnr,
      customTweetText,
    } = body;

    let tweetText = customTweetText?.trim();
    if (!tweetText) {
      if (!airlineId || !category) {
        return NextResponse.json(
          { success: false, error: "Missing required fields: airlineId and category" },
          { status: 400 }
        );
      }

      tweetText = buildGrievanceTweet({
        airlineId: airlineId as AirlineId,
        category: category as GrievanceCategory,
        pnr,
        flightNumber,
        travelDate,
        maskPnr: Boolean(maskPnr),
      });
    }

    if (tweetText.length > 280) {
      return NextResponse.json(
        {
          success: false,
          error: `Tweet exceeds 280 characters (currently ${tweetText.length} characters)`,
          tweetText,
        },
        { status: 400 }
      );
    }

    const result = await publishToTwitter(tweetText);

    return NextResponse.json(result, { status: result.success ? 200 : 200 });
  } catch (error: any) {
    console.error("[API Grievance Tweet] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error publishing tweet",
      },
      { status: 500 }
    );
  }
}
