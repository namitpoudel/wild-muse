"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { getReviewEligibilityAction, submitReviewAction } from "@/app/actions/reviews";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TextArea, TextField } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Eligibility = Awaited<ReturnType<typeof getReviewEligibilityAction>>;

export function WriteReview({ productId, productName, slug }: { productId: string; productName: string; slug: string }) {
  const [elig, setElig] = useState<Eligibility | null>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const router = useRouter();

  useEffect(() => {
    void getReviewEligibilityAction(productId).then((e) => {
      setElig(e);
      if (e.existing) setRating(e.existing.rating);
    });
  }, [productId]);

  if (!elig) return <div className="mt-5 h-11" />;
  if (!elig.signedIn)
    return (
      <p className="mt-5 text-sm">
        <Link href={`/login?next=/products/${slug}`} className="font-semibold text-terracotta underline underline-offset-4">
          Sign in
        </Link>{" "}
        to write a review.
      </p>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-5">
          {elig.existing ? "Edit your review" : "Write a review"}
        </Button>
      </DialogTrigger>
      <DialogContent title={elig.existing ? "Edit your review" : "Write a review"} description={productName}>
        {elig.existing?.status === "PENDING" && <p className="mb-4 rounded-[2px] bg-cream p-3 text-xs">Your review is awaiting moderation.</p>}
        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            fd.set("rating", String(rating));
            fd.set("productId", productId);
            start(async () => {
              const r = await submitReviewAction(fd);
              if (!r.ok) {
                setErrors(r.fieldErrors ?? { form: r.error });
                return;
              }
              toast.success(r.message);
              setOpen(false);
              router.refresh();
            });
          }}
        >
          {errors.form && <p className="text-sm text-danger">{errors.form}</p>}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Your rating</legend>
            <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => setRating(n)}
                  className="rounded p-0.5"
                >
                  <Star className={cn("size-7", n <= rating ? "fill-mustard text-mustard" : "text-sand-deep")} strokeWidth={1.5} />
                </button>
              ))}
            </div>
            {errors.rating && <p className="mt-1 text-xs text-danger">{errors.rating}</p>}
          </fieldset>
          <TextField label="Title" name="title" maxLength={80} defaultValue={elig.existing?.title} error={errors.title} />
          <TextArea
            label="Your review"
            name="body"
            maxLength={2000}
            defaultValue={elig.existing?.body}
            error={errors.body}
            hint="How does it fit, feel and wash? At least 20 characters."
          />
          <TextField label="Colour / size you bought" name="variantLabel" optional maxLength={60} placeholder="e.g. Terracotta, size 12" />
          <div>
            <label htmlFor="photos" className="text-sm font-semibold">
              Photos <span className="font-normal text-bark">(optional, up to 3)</span>
            </label>
            <input id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="mt-1.5 block w-full text-sm" />
          </div>
          <p className="text-xs text-bark">
            {elig.purchased
              ? "You bought this item, so your review will show a Verified purchase badge."
              : "We couldn't find this item in your orders, so your review won't be marked as a verified purchase."}{" "}
            Reviews are checked before publishing.{" "}
            <Link href="/pages/review-policy" className="underline">
              Review policy
            </Link>
          </p>
          <Button type="submit" block disabled={pending}>
            {pending ? "Submitting…" : "Submit review"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReportReview({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-xs text-bark underline-offset-4 hover:text-danger hover:underline">Report</DialogTrigger>
      <DialogContent title="Report this review" description="Tell us why you think this review is fake, offensive or inappropriate.">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const reason = String(new FormData(e.currentTarget).get("reason") ?? "");
            start(async () => {
              const { reportReviewAction } = await import("@/app/actions/reviews");
              const r = await reportReviewAction({ reviewId, reason });
              if (r.ok) {
                toast.success(r.message);
                setOpen(false);
              } else toast.error(r.error);
            });
          }}
        >
          <TextArea label="Reason" name="reason" maxLength={500} required />
          <Button type="submit" block disabled={pending}>
            Send report
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
