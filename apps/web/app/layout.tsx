import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weather Monitor",
  description: "Realtime weather monitoring across selected cities"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
