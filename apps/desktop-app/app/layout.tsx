import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";

export const metadata: Metadata = {
  title: "Omnia Desktop",
  description: "Hybrid omnichannel POS desktop shell",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
