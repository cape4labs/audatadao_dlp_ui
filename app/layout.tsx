import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AUDATA CONTRIBUTION WINDOW",
  description: "Connect your wallet and contribute data to the VANA network",
  icons: "icon.jpg",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="antialiased"
        style={{ fontFamily: "HomeVideo, sans-serif" }}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
