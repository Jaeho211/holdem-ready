import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const appSans = Noto_Sans_KR({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-app-sans",
  fallback: ["system-ui", "sans-serif"],
});

const appSerif = Noto_Serif_KR({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-app-serif",
  fallback: ["serif"],
});

export const metadata: Metadata = {
  applicationName: "Holdem Ready",
  title: {
    default: "Holdem Ready",
    template: "%s | Holdem Ready",
  },
  description:
    "라스베가스 라이브 홀덤을 준비하는 사람을 위한 모바일 우선 학습 웹앱",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Holdem Ready",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b3b2e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${appSans.variable} ${appSerif.variable} h-full`}>
      <body className={`${appSans.className} min-h-full bg-[#041711] text-[#f6efe0] antialiased`}>
        {children}
      </body>
    </html>
  );
}
