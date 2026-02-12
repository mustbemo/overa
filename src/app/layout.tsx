import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clock Widget",
  description: "Always-on-top draggable clock widget built with Tauri and Next.js",
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
