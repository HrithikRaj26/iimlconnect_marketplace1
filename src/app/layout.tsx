import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IIML Connect — Student Marketplace",
  description: "A verified-identity marketplace for the IIM Lucknow community.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-gray-900">{children}</body>
    </html>
  );
}
