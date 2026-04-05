import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import {
  APP_BACKGROUND_COLOR,
  APP_DESCRIPTION,
  APP_NAME,
  APP_THEME_COLOR,
  getAppMetadataBase,
} from "@/lib/app-config";
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

const metadataBase = getAppMetadataBase();

export const metadata: Metadata = {
  ...(metadataBase ? { metadataBase } : {}),
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: APP_THEME_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${appSans.variable} ${appSerif.variable} h-full`}>
      <body
        className={`${appSans.className} min-h-full text-[#f6efe0] antialiased`}
        style={{ backgroundColor: APP_BACKGROUND_COLOR }}
      >
        {children}
      </body>
    </html>
  );
}
