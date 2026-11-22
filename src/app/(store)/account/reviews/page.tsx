import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "My reviews" };

export default function MyReviewsPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">My reviews</h1>
      <EmptyState icon={Star} title="Nothing to review yet" className="rounded-[2px] border border-sand">
        After your order arrives, products you bought appear here ready to review. You can add photos and edit a review at any time.{" "}
        <Link href="/pages/review-policy" className="underline">
          Review policy
        </Link>
      </EmptyState>
    </div>
  );
}
