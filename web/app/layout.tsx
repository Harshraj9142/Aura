import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AURA — Airfare Price Index",
  description:
    "Real-time Airfare Price Index for India — tracking domestic flight fares across airlines and OTAs.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="font-sans antialiased h-full bg-[#F3F6F7] text-[#08080D] selection:bg-[#08080D] selection:text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
