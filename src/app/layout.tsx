import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { StoreProvider } from "@/components/cart/store-provider";
import { ConsentManager } from "@/components/consent/consent-manager";
import { ConfigProvider } from "@/components/config-provider";
import { siteConfig } from "@/config/site";
import { getPublicConfig } from "@/server/public-config";
import { getSettings } from "@/server/settings";
import "./globals.css";

const fraunces = localFont({
  src: [
    { path: "./fonts/fraunces-latin-wght-normal.woff2", style: "normal", weight: "100 900" },
    { path: "./fonts/fraunces-latin-wght-italic.woff2", style: "italic", weight: "100 900" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

const manrope = localFont({
  src: "./fonts/manrope-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: s.seo.defaultTitle, template: `%s | ${s.business.name}` },
    description: s.seo.defaultDescription,
    openGraph: { siteName: s.business.name, locale: "en_GB", type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: "#fbf7f0",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const config = await getPublicConfig();
  return (
    <html lang="en-GB" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[2px] focus:bg-chocolate focus:px-4 focus:py-3 focus:text-linen"
        >
          Skip to content
        </a>
        <ConfigProvider value={config}>
          <StoreProvider>
            {children}
            <ConsentManager />
            <Toaster
              position="bottom-center"
              toastOptions={{
                className: "!rounded-[2px] !border-sand !bg-linen !text-chocolate !font-sans !shadow-lift",
              }}
            />
          </StoreProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
