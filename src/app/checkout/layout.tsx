import Link from "next/link";
import { Lock } from "lucide-react";
import { Logo } from "@/components/brand/logo";

/** Distraction-free checkout shell (no mega-menu, no footer promos) — standard conversion practice. */
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-sand bg-linen">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-olive-deep">
            <Lock className="size-3.5" aria-hidden /> Secure checkout
          </p>
        </div>
      </header>
      <main id="main" className="container-page py-8 md:py-12">
        <Link href="/cart" className="mb-6 inline-block text-sm underline underline-offset-4">
          ← Back to bag
        </Link>
        {children}
      </main>
    </>
  );
}
