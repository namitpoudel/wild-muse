import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export interface Crumb {
  label: string;
  href?: string;
}

/** Visible breadcrumb trail plus matching BreadcrumbList structured data. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-bark">
      <JsonLd data={breadcrumbJsonLd(items)} />
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((c, i) => (
          <li key={c.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3" aria-hidden />}
            {c.href && i < items.length - 1 ? (
              <Link href={c.href} className="hover:text-chocolate hover:underline underline-offset-4">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold text-chocolate">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
