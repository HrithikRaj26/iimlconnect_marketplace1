import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IIM L Connect - MVP",
  description: "A verified-identity ecosystem for the IIM Lucknow community.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      </head>
      <body className={`${inter.className} antialiased text-gray-900 bg-gray-50 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
