import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vivere",
  description: "Life happens. We will plan the rest.",
  applicationName: "Vivere",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
