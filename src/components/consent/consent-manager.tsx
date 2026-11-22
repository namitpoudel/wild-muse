"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { clearTrackerCookies, OPEN_COOKIE_SETTINGS_EVENT, readConsent, writeConsent, type ConsentState } from "@/lib/consent";
import { Trackers } from "./trackers";

/** Cookie banner + preferences dialog. Mounted once in the root layout. */
export function ConsentManager() {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [decided, setDecided] = useState(true); // assume decided until we've read the cookie (avoids banner flash)
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    const c = readConsent();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read browser cookie after mount
    setConsent(c);
    setDecided(!!c);
    const onOpen = () => {
      const cur = readConsent();
      setDraft({ analytics: !!cur?.analytics, marketing: !!cur?.marketing });
      setOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
  }, []);

  const save = useCallback(
    (analytics: boolean, marketing: boolean) => {
      const withdrew = (consent?.analytics && !analytics) || (consent?.marketing && !marketing);
      setConsent(writeConsent(analytics, marketing));
      setDecided(true);
      setOpen(false);
      if (withdrew) {
        // Scripts already running can't be unloaded; clear their cookies and reload without them.
        clearTrackerCookies();
        window.location.reload();
      }
    },
    [consent],
  );

  return (
    <>
      <Trackers analytics={!!consent?.analytics} marketing={!!consent?.marketing} />
      {!decided && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl animate-fade-up rounded-[3px] border border-sand bg-linen p-5 shadow-lift md:inset-x-6 md:bottom-6 md:p-6"
        >
          <h2 className="font-display text-xl">We value your privacy</h2>
          <p className="mt-2 text-sm text-bark">
            We use essential cookies to run the shop. With your permission we&apos;d also like to use analytics cookies to improve the site and
            marketing cookies to measure our adverts. You can change your mind at any time.{" "}
            <Link href="/pages/cookies" className="font-semibold underline underline-offset-4">
              Cookie policy
            </Link>
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button variant="dark" onClick={() => save(true, true)}>
              Accept all
            </Button>
            <Button variant="dark" onClick={() => save(false, false)}>
              Reject all
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDraft({ analytics: false, marketing: false });
                setOpen(true);
              }}
            >
              Manage preferences
            </Button>
          </div>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Cookie preferences" description="Choose which optional cookies we may use. Strictly necessary cookies are always on.">
          <div className="space-y-3">
            <Pref title="Strictly necessary" text="Shopping bag, checkout, sign-in, security and remembering this choice." checked disabled />
            <Pref
              title="Analytics"
              text="Helps us understand how the site is used (Google Analytics 4)."
              checked={draft.analytics}
              onChange={(v) => setDraft((d) => ({ ...d, analytics: v }))}
            />
            <Pref
              title="Marketing"
              text="Measures our social media adverts (Meta Pixel, TikTok Pixel)."
              checked={draft.marketing}
              onChange={(v) => setDraft((d) => ({ ...d, marketing: v }))}
            />
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => save(false, false)}>
              Reject all
            </Button>
            <Button variant="dark" onClick={() => save(draft.analytics, draft.marketing)}>
              Save choices
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Pref({
  title,
  text,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  text: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-[2px] border border-sand p-4 has-[:disabled]:cursor-default">
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-bark">{text}</span>
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="peer sr-only"
        />
        <span className="h-6 w-11 rounded-full bg-sand-deep transition-colors peer-checked:bg-olive peer-focus-visible:ring-2 peer-focus-visible:ring-terracotta peer-disabled:opacity-60" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
