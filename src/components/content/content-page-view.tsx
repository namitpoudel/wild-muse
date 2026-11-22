import { Scale } from "lucide-react";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import type { ContentPage } from "@/lib/content/types";
import { ContentRenderer } from "./content-renderer";

export function ContentPageView({ page, crumbs, aside }: { page: ContentPage; crumbs: Crumb[]; aside?: React.ReactNode }) {
  return (
    <>
      <div className="texture-grain border-b border-sand bg-cream">
        <div className="container-page py-8 md:py-12">
          <Breadcrumbs items={crumbs} />
          {page.eyebrow && <p className="eyebrow mt-6 text-terracotta">{page.eyebrow}</p>}
          <h1 className="mt-3 font-display text-display-lg font-light">{page.title}</h1>
          <p className="mt-3 text-xs text-bark">Last updated {page.lastUpdated}</p>
        </div>
      </div>
      <div className="container-page grid gap-12 py-10 md:py-14 lg:grid-cols-12">
        <article className="lg:col-span-8">
          {page.requiresLegalReview && (
            <p className="mb-6 flex gap-3 rounded-[2px] border border-terracotta/40 bg-terracotta/5 p-4 text-sm text-chocolate">
              <Scale className="mt-0.5 size-4 shrink-0 text-terracotta" aria-hidden />
              <span>
                <strong>Pre-launch template.</strong> This policy is based on UK government guidance and must be reviewed by a qualified solicitor and
                completed with the business&apos;s details before the shop opens. This notice is removed in the admin once approved.
              </span>
            </p>
          )}
          <ContentRenderer blocks={page.blocks} />
        </article>
        {aside && <aside className="lg:col-span-4">{aside}</aside>}
      </div>
    </>
  );
}
