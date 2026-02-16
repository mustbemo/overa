import type { Metadata } from "next";
import { AppQueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Overa - Live Cricket Desktop Companion",
  description:
    "Desktop cricket companion with live scores, match details, and an optional floating subscribe widget.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppQueryProvider>{children}</AppQueryProvider>
      </body>
    </html>
  );
}
