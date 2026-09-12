import type { Metadata } from "next";
import { SpriteAnimation } from "@/components/landing/SpriteAnimation";
import { PrimaryCorridorsSection } from "@/components/landing/PrimaryCorridorsSection";

export const metadata: Metadata = {
  title: "AURA — Airfare Price Index",
  description:
    "Real-time airfare intelligence, indexed. Tracking India's skies, one fare at a time.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F3F6F7]">
      <SpriteAnimation />
      <PrimaryCorridorsSection />
    </main>
  );
}
