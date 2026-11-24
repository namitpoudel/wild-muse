import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { Suspense } from "react";
import { AccountSkeleton } from "@/components/account/account-skeleton";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StarRating } from "@/components/ui/star-rating";
import { getMyReviewData } from "@/server/account";

export const metadata: Metadata = { title: "My reviews" };
const STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  APPROVED: { label: "Published", tone: "success" },
  PENDING: { label: "Awaiting moderation", tone: "warning" },
  REJECTED: { label: "Not published", tone: "danger" },
};

export default function MyReviewsPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">My reviews</h1>
      <Suspense fallback={<AccountSkeleton />}>
        <Reviews />
      </Suspense>
    </div>
  );
}

async function Reviews() {
  const { reviews, toReview } = await getMyReviewData();
  return (
    <div className="space-y-8">
      {toReview.length > 0 && (
        <section aria-labelledby="to-review">
          <h2 id="to-review" className="mb-3 font-display text-xl">
            Waiting for your review
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {toReview.map((p) => (
              <li key={p.productId} className="flex items-center justify-between gap-3 rounded-[2px] border border-sand p-4">
                <span className="font-medium">{p.productName}</span>
                <ButtonLink href={`/products/${p.productSlug}#reviews-heading`} size="sm" variant="outline">
                  Review
                </ButtonLink>
              </li>
            ))}
          </ul>
        </section>
      )}
      {reviews.length ? (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-[2px] border border-sand p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href={`/products/${r.product.slug}#reviews-heading`} className="font-semibold hover:underline">
                  {r.product.name}
                </Link>
                <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
              </div>
              <StarRating average={r.rating} count={1} showCount={false} className="mt-2" />
              <p className="mt-2 font-semibold">{r.title}</p>
              <p className="mt-1 text-sm text-bark">{r.body}</p>
              {r.verifiedPurchase && <p className="mt-2 text-xs font-semibold text-olive-deep">Verified purchase</p>}
            </li>
          ))}
        </ul>
      ) : (
        toReview.length === 0 && (
          <EmptyState icon={Star} title="Nothing to review yet" className="rounded-[2px] border border-sand">
            After your order arrives, products you bought appear here ready to review.
          </EmptyState>
        )
      )}
    </div>
  );
}
