import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { AppLoaderRemover } from "@/components/app-loader-remover";

const playfairDisplayHeading = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Revigion",
  description: "Spaced-repetition revision tracker",
  manifest: "/manifest.webmanifest",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#111110",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        poppins.variable,
        playfairDisplayHeading.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">
        <style dangerouslySetInnerHTML={{ __html: `
          #app-loader {
            position: fixed;
            inset: 0;
            background: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            z-index: 9999;
            transition: opacity 0.3s ease;
          }
          #app-loader-spinner {
            width: 36px;
            height: 36px;
            border: 3px solid #e5e0da;
            border-top-color: #3a2e28;
            border-radius: 50%;
            animation: app-spin 0.75s linear infinite;
          }
          #app-loader-text {
            font-family: system-ui, sans-serif;
            font-size: 15px;
            font-weight: 500;
            color: #3a2e28;
            letter-spacing: 0.02em;
          }
          @keyframes app-spin {
            to { transform: rotate(360deg); }
          }
        ` }} />
        <div id="app-loader">
          <div id="app-loader-spinner" />
          <span id="app-loader-text">Revigion</span>
        </div>
        <AppLoaderRemover />
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
