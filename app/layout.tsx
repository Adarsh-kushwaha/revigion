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
            background: #FFEF9D;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
            z-index: 9999;
            transition: opacity 0.35s ease;
          }
          #app-loader-name {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 28px;
            font-weight: 700;
            color: #111110;
            letter-spacing: -0.02em;
          }
          #app-loader-motto {
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 13px;
            font-weight: 400;
            color: #3a3a35;
            letter-spacing: 0.01em;
          }
        ` }} />
        <div id="app-loader">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="80" rx="17" fill="#111110"/>
            <text x="40" y="58" textAnchor="middle" fontFamily="ui-monospace, monospace" fontWeight="700" fontSize="54" fill="#FFEF9D">R</text>
          </svg>
          <span id="app-loader-name">Revigion</span>
          <span id="app-loader-motto">Spaced-repetition revision tracker</span>
        </div>
        <AppLoaderRemover />
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
