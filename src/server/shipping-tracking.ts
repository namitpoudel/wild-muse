/**
 * Carrier tracking links. Adding a carrier here is all that's needed to support it in the
 * admin dispatch form. (API-based label creation/tracking — e.g. Royal Mail Click & Drop —
 * plugs in through src/server/shipping-providers in Stage 5.)
 */
export const CARRIERS: Record<string, { name: string; url: (n: string) => string }> = {
  royalmail: { name: "Royal Mail", url: (n) => `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(n)}` },
  parcelforce: { name: "Parcelforce", url: (n) => `https://www.parcelforce.com/track-trace?trackNumber=${encodeURIComponent(n)}` },
  dpd: { name: "DPD", url: (n) => `https://track.dpd.co.uk/parcels/${encodeURIComponent(n)}` },
  evri: { name: "Evri", url: (n) => `https://www.evri.com/track/parcel/${encodeURIComponent(n)}` },
  dhl: { name: "DHL", url: (n) => `https://www.dhl.com/gb-en/home/tracking.html?tracking-id=${encodeURIComponent(n)}` },
  other: { name: "Other courier", url: () => "" },
};
