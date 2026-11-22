"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

/** Friendly error boundary — never shows stack traces or internal details to customers. */
export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error); // Stage 6: forwarded to error monitoring
  }, [error]);
  return (
    <main id="main" className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="eyebrow text-terracotta">Something went wrong</p>
      <h1 className="mt-3 font-display text-display-md">We hit a snag loading this page.</h1>
      <p className="mt-3 max-w-md text-bark">Please try again. If it keeps happening, contact us and quote reference {error.digest ?? "—"}.</p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="outline">
          Go to homepage
        </ButtonLink>
      </div>
    </main>
  );
}
