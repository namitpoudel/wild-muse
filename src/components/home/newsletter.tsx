"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";
import { siteConfig } from "@/config/site";

/**
 * Newsletter sign-up (UK GDPR / PECR): consent box is unticked by default, purpose is
 * stated, and unsubscribing is explained. Stage 4 stores the subscriber with consent
 * text + timestamp and sends a double opt-in email before any marketing is sent.
 */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please enter a valid email address.");
    if (!consent) return setError("Please tick the box to confirm you'd like to receive our emails.");
    setError(null);
    toast.info("Newsletter sign-up is connected to the database in Stage 4 — nothing was saved yet.");
  }

  const pct = siteConfig.commerce.newsletterDiscountPercent;
  return (
    <section id="newsletter" className="texture-grain bg-sand" aria-labelledby="newsletter-heading">
      <div className="container-page grid gap-8 py-16 md:py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow mb-3 text-terracotta">Newsletter</p>
          <h2 id="newsletter-heading" className="font-display text-display-lg font-light uppercase">
            Join the wild side.
          </h2>
          <p className="mt-4 max-w-md text-bark">
            New collections, artisan stories and early access to the sale — plus an optional {pct}% off your first order when you subscribe.
          </p>
        </div>
        <form onSubmit={onSubmit} noValidate className="space-y-4" aria-describedby={error ? "newsletter-error" : undefined}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="h-13 flex-1 rounded-[2px] border border-sand-deep bg-linen px-4 text-chocolate placeholder:text-bark/80 focus:border-chocolate focus:outline-none"
            />
            <Button type="submit" variant="dark" size="lg">
              Subscribe
            </Button>
          </div>
          <Checkbox
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            label="Yes, I'd like to receive emails from Wild Muse about new products, offers and stories."
            description={
              <>
                You can unsubscribe at any time using the link in every email. See our{" "}
                <Link href="/pages/privacy" className="underline">
                  privacy policy
                </Link>{" "}
                for how we use your data.
              </>
            }
          />
          {error && (
            <p id="newsletter-error" role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
