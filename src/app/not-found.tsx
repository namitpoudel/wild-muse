import { Logo } from "@/components/brand/logo";
import { NotFoundContent } from "@/components/layout/not-found-content";

/** Unmatched URLs (rendered outside the store layout, so it provides its own <main>). */
export default function NotFound() {
  return (
    <main id="main" className="texture-grain flex min-h-dvh flex-col bg-cream">
      <div className="container-page py-6">
        <Logo />
      </div>
      <NotFoundContent />
    </main>
  );
}
