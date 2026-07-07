import type { Metadata, Viewport } from "next";
import { Syne, Plus_Jakarta_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  weight: ["700", "800"],
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NUTRIE — Know what you eat",
  description: "Your smart nutrition coach",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${jakarta.variable} ${dmMono.variable} h-full`}
    >
      <body className="min-h-full bg-bg text-text antialiased">
        <div className="relative mx-auto min-h-screen w-full max-w-[430px] bg-bg">
          {children}
          <span className="watermark">nutrie.app</span>
        </div>
      </body>
    </html>
  );
}
