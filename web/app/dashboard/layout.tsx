import Header from "@/components/Header";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full font-body flex flex-col justify-between">
      {/* 
        User-provided Cloud Background:
        Uses /landing/custom_cloud_bg.png blurred as the background for all dashboard pages.
      */}
      <div
        className="fixed inset-0 h-full w-full bg-[url('/landing/custom_cloud_bg.png')] bg-cover bg-center bg-no-repeat pointer-events-none z-0"
        style={{
          filter: "blur(18px) brightness(1.02)",
          transform: "scale(1.08)",
        }}
      />

      {/* Main Content Layout */}
      <div className="relative z-10 flex min-h-screen flex-col justify-between">
        <Header />
        <main className="flex-1 w-full pt-0 pb-16">
          {children}
        </main>
        {/* LandingFooter rendered consistently across all dashboard pages */}
        <LandingFooter />
      </div>
    </div>
  );
}
