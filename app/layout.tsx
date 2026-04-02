import type { Metadata } from "next";
import { Crimson_Text, Inter } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/layout/AppHeader";

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-serif",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "WFRP 4e Character Generator",
  description: "Warhammer Fantasy Roleplay 4e Character Generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${crimsonText.variable} ${inter.variable}`}>
      <body className="font-sans antialiased bg-gray-950 text-gray-100 min-h-screen" suppressHydrationWarning>
        <AppHeader />
        <div className="pt-5">
          {children}
        </div>
      </body>
    </html>
  );
}
