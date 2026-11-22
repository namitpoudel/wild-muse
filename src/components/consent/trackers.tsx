"use client";

import Script from "next/script";

/**
 * Third-party trackers, injected ONLY after the matching consent category is granted
 * and ONLY when an ID is configured. Without IDs nothing loads at all.
 *   NEXT_PUBLIC_GA4_ID           e.g. G-XXXXXXX   (Analytics consent)
 *   NEXT_PUBLIC_META_PIXEL_ID    numeric          (Marketing consent)
 *   NEXT_PUBLIC_TIKTOK_PIXEL_ID  alphanumeric     (Marketing consent)
 */
const GA4 = process.env.NEXT_PUBLIC_GA4_ID;
const META = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TIKTOK = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
const SAFE_ID = /^[A-Za-z0-9-]{4,40}$/; // IDs are interpolated into inline scripts, so validate strictly

export function Trackers({ analytics, marketing }: { analytics: boolean; marketing: boolean }) {
  return (
    <>
      {analytics && GA4 && SAFE_ID.test(GA4) && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {marketing && META && SAFE_ID.test(META) && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META}');fbq('track','PageView');`}
        </Script>
      )}
      {marketing && TIKTOK && SAFE_ID.test(TIKTOK) && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e){var n="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=n;var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=n+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${TIKTOK}');ttq.page();}(window,document,'ttq');`}
        </Script>
      )}
    </>
  );
}
