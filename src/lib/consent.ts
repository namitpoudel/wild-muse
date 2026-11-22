/**
 * Cookie consent state (UK GDPR + PECR as amended by the Data (Use and Access) Act 2025).
 * - Strictly necessary storage never needs consent.
 * - Analytics and marketing trackers load ONLY after opt-in, and "Reject" is as easy as "Accept".
 * - The choice is stored in a first-party cookie for 6 months, then we ask again.
 * Stage 4 also records each decision server-side (ConsentRecord) as evidence of consent.
 */
export const CONSENT_COOKIE = "wm_consent";
export const CONSENT_VERSION = 1;
const MAX_AGE_DAYS = 180;

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  version: number;
  decidedAt: string;
}

export function readConsent(): ConsentState | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!raw) return null;
  try {
    const v = JSON.parse(decodeURIComponent(raw.split("=").slice(1).join("="))) as ConsentState;
    return v.version === CONSENT_VERSION ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(analytics: boolean, marketing: boolean): ConsentState {
  const state: ConsentState = { analytics, marketing, version: CONSENT_VERSION, decidedAt: new Date().toISOString() };
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(state))}; Max-Age=${MAX_AGE_DAYS * 86400}; Path=/; SameSite=Lax${secure}`;
  return state;
}

/** Best-effort removal of tracker cookies after consent is withdrawn. */
export function clearTrackerCookies() {
  const names = document.cookie.split("; ").map((c) => c.split("=")[0]);
  const host = location.hostname;
  for (const n of names) {
    if (/^(_ga|_gid|_gat|_fbp|_fbc|_ttp|_tt_)/.test(n)) {
      for (const domain of ["", `; Domain=${host}`, `; Domain=.${host.split(".").slice(-2).join(".")}`]) {
        document.cookie = `${n}=; Max-Age=0; Path=/${domain}`;
      }
    }
  }
}

export const OPEN_COOKIE_SETTINGS_EVENT = "wm:open-cookie-settings";
