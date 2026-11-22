import Link from "next/link";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";

export function ListingHeader({
  title,
  intro,
  crumbs,
  chips,
  activeChip,
}: {
  title: string;
  intro?: string;
  crumbs: Crumb[];
  chips?: { label: string; href: string }[];
  activeChip?: string;
}) {
  return (
    <div className="texture-grain border-b border-sand bg-cream">
      <div className="container-page py-8 md:py-12">
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-4 font-display text-display-lg font-light">{title}</h1>
        {intro && <p className="mt-3 max-w-xl text-bark">{intro}</p>}
        {chips && chips.length > 0 && (
          <nav aria-label="Categories" className="-mx-4 mt-6 overflow-x-auto px-4 scrollbar-none md:mx-0 md:px-0">
            <ul className="flex gap-2 pb-1 md:flex-wrap">
              {chips.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    aria-current={activeChip === c.href ? "page" : undefined}
                    className={cn(
                      "inline-flex h-9 items-center whitespace-nowrap rounded-full border px-4 text-xs font-semibold transition-colors",
                      activeChip === c.href ? "border-chocolate bg-chocolate text-linen" : "border-sand-deep bg-linen/70 hover:border-chocolate",
                    )}
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
