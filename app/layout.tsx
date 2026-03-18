import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flowdesk — Autonomous YouTube Command Center",
  description: "AI-powered YouTube content creation dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-black`}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 min-w-0 lg:ml-[220px]">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
