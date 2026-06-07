import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "TestMyAPI — API Testing Playground",
  description:
    "A fast, browser-based playground for composing HTTP requests and inspecting responses. Send GET, POST, PUT, PATCH and DELETE requests with custom headers, query params, auth and a body.",
  applicationName: "TestMyAPI",
  authors: [{ name: "TestMyAPI" }],
  keywords: ["API", "HTTP client", "REST", "testing", "playground", "Postman alternative"],
  openGraph: {
    title: "TestMyAPI — API Testing Playground",
    description: "Compose HTTP requests and inspect responses, right in the browser.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
