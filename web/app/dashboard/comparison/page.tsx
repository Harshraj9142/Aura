import { Metadata } from "next";
import { getPlatformComparisons } from "@/lib/services/comparison.service";
import ComparisonClientView from "@/components/comparison/ComparisonClientView";

export const metadata: Metadata = {
  title: "Platform Fare Comparison | OTA vs Airline Direct | Aura",
  description:
    "Analyze airfare price spreads and variation between Airline Direct booking platforms (IndiGo, Air India) and Online Travel Agencies (MakeMyTrip, EaseMyTrip, Cleartrip, Ixigo).",
};

export const revalidate = 30; // 30 seconds ISR cache

export default async function ComparisonPage() {
  // Query strictly from verified database records
  const initialData = await getPlatformComparisons({});

  return (
    <main className="w-full min-h-screen">
      <ComparisonClientView initialData={initialData} />
    </main>
  );
}
