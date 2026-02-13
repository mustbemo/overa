import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CricLive",
  description: "Live and upcoming cricket matches with full scorecards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
