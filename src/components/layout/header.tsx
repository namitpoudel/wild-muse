import { Logo } from "@/components/brand/logo";
import { buildMainNav } from "@/config/navigation";
import { getCategories } from "@/server/catalog/queries";
import { DesktopNav } from "./desktop-nav";
import { HeaderActions } from "./header-actions";
import { MobileNav } from "./mobile-nav";

/**
 * Sticky header — compact single row on mobile/tablet; two tiers on desktop
 * (centred wordmark, then navigation) so long labels never wrap at 1024–1440px.
 * The <header> is the positioning context for the full-width mega-menu panels,
 * so inner wrappers must not be `position: relative`.
 */
export async function Header() {
  const mainNav = buildMainNav(await getCategories());
  return (
    <header className="sticky top-0 z-40 border-b border-sand bg-linen/95 backdrop-blur supports-[backdrop-filter]:bg-linen/90">
      <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-2 lg:h-[4.25rem]">
        <div className="lg:hidden">
          <MobileNav items={mainNav} />
        </div>
        <p className="hidden text-xs text-bark lg:block">Handmade in Nepal · Shipped across the UK</p>
        <Logo />
        <div className="justify-self-end">
          <HeaderActions />
        </div>
      </div>
      <div className="hidden h-12 justify-center border-t border-sand/70 lg:flex">
        <DesktopNav items={mainNav} />
      </div>
    </header>
  );
}
