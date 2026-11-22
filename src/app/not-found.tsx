import Link from "next/link";
import { Artwork } from "@/components/brand/artwork";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="texture-grain flex min-h-dvh flex-col bg-cream">
      <div className="container-page py-6">
        <Logo />
      </div>
      <div className="container-page grid flex-1 items-center gap-10 py-10 md:grid-cols-2">
        <div>
          <p className="eyebrow text-terracotta">Error 404</p>
          <h1 className="mt-3 font-display text-display-lg font-light">This path wandered off.</h1>
          <p className="mt-4 max-w-md text-bark">
            The page you&apos;re looking for doesn&apos;t exist or has moved. Some sections of the site are still being built.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/">Back to home</ButtonLink>
            <ButtonLink href="/new-arrivals" variant="outline">
              New arrivals
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm">
            Need help?{" "}
            <Link href="/pages/contact" className="underline underline-offset-4">
              Contact us
            </Link>
          </p>
        </div>
        <div className="mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-t-[999px]">
          <Artwork kind="landscape" tone="olive" label="" />
        </div>
      </div>
    </main>
  );
}
