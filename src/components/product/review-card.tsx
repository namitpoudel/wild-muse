import { BadgeCheck } from "lucide-react";
import { ReportReview } from "./review-form";
import { StarRating } from "@/components/ui/star-rating";

export interface ReviewView {
  id: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  /** Computed server-side from order history — never user-supplied. */
  verifiedPurchase: boolean;
  dateLabel: string;
  variantLabel?: string;
  images?: { url: string; alt: string }[];
}

export function ReviewCard({ review, reportable }: { review: ReviewView; reportable?: boolean }) {
  return (
    <article className="flex h-full flex-col rounded-[2px] bg-linen p-6 shadow-soft">
      <StarRating average={review.rating} count={1} showCount={false} />
      <h3 className="mt-3 font-display text-xl">{review.title}</h3>
      <p className="mt-2 flex-1 whitespace-pre-line text-sm leading-relaxed text-bark">{review.body}</p>
      {review.images && review.images.length > 0 && (
        <ul className="mt-3 flex gap-2">
          {review.images.map((img) => (
            <li key={img.url} className="size-16 overflow-hidden rounded-[2px] bg-sand">
              {/* eslint-disable-next-line @next/next/no-img-element -- customer uploads are already resized server-side */}
              <img src={img.url} alt={img.alt} loading="lazy" className="h-full w-full object-cover" />
            </li>
          ))}
        </ul>
      )}
      <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-sand pt-4 text-xs">
        <div>
          <p className="font-semibold">{review.authorName}</p>
          <p className="text-bark">
            {review.dateLabel}
            {review.variantLabel && ` · ${review.variantLabel}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {review.verifiedPurchase && (
            <span className="inline-flex items-center gap-1 font-semibold text-olive-deep">
              <BadgeCheck className="size-4" aria-hidden /> Verified purchase
            </span>
          )}
          {reportable && review.id !== "sample" && <ReportReview reviewId={review.id} />}
        </div>
      </footer>
    </article>
  );
}
