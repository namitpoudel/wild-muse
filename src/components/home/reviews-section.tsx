import Link from "next/link";
import { MessageSquareHeart } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { ReviewCard, type ReviewView } from "@/components/product/review-card";

/**
 * Customer reviews. Only real, moderated reviews are ever shown (DMCC Act 2024).
 * With no orders yet, this honestly shows an empty state rather than invented testimonials.
 */
export function ReviewsSection({ reviews }: { reviews: ReviewView[] }) {
  return (
    <section className="bg-cream" aria-labelledby="reviews-heading">
      <div className="container-page py-16 md:py-24">
        <SectionHeading id="reviews-heading" eyebrow="Customer reviews" title="Words from our wild ones" align="center" />
        {reviews.length ? (
          <ul className="grid gap-5 md:grid-cols-3">
            {reviews.map((r) => (
              <li key={r.id}>
                <ReviewCard review={r} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={MessageSquareHeart} title="Our first reviews are on their way" className="mx-auto max-w-lg rounded-[2px] bg-linen">
            Reviews appear here once customers have received their orders. Every review comes from a real account and verified purchases are clearly
            marked.{" "}
            <Link href="/pages/review-policy" className="underline underline-offset-4">
              Read our review policy
            </Link>
            .
          </EmptyState>
        )}
      </div>
    </section>
  );
}
