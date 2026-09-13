import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "csv";

    const fares = await prisma.fare.findMany({
      orderBy: { scraped_at: "desc" },
      take: 1000,
    });

    if (format === "json") {
      return NextResponse.json({
        success: true,
        count: fares.length,
        data: fares,
      });
    }

    // Generate CSV output
    const headers = [
      "ID",
      "Route Origin",
      "Route Destination",
      "Travel Date",
      "Advance Purchase Days",
      "Source OTA",
      "Source Type",
      "Carrier / Airline",
      "Flight Number",
      "Fare Class",
      "Base Fare (INR)",
      "Taxes & Fees (INR)",
      "Total Fare (INR)",
      "Currency",
      "Is Outlier",
      "Scraped At (UTC)",
    ];

    const rows = fares.map((f: any) => [
      f.id,
      f.route_origin,
      f.route_destination,
      f.travel_date.toISOString().split("T")[0],
      f.advance_purchase_days,
      f.source,
      f.source_type,
      f.carrier,
      f.flight_number || "Direct",
      f.fare_class,
      f.base_fare ? Number(f.base_fare).toFixed(2) : "",
      f.taxes_and_fees ? Number(f.taxes_and_fees).toFixed(2) : "",
      Number(f.total_fare).toFixed(2),
      f.currency,
      f.is_outlier ? "TRUE" : "FALSE",
      f.scraped_at.toISOString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => row.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="APIx_Airfare_Records_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate CSV export" },
      { status: 500 }
    );
  }
}
