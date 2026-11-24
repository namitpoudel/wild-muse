import Link from "next/link";
import { Suspense } from "react";
import { moderateReviewAction } from "./actions";
import { AdminForm, F } from "@/components/admin/admin-form";
import { AdminHeader, AdminSkeleton } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import type { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";

export const metadata = { title: "Reviews" };
const TABS = [
  { key: "pending", label: "Awaiting moderation" },
  { key: "reported", label: "Reported" },
  { key: "approved", label: "Published" },
  { key: "rejected", label: "Rejected" },
];
const dt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function ReviewsAdminPage({ searchParams }: PageProps<"/admin/reviews">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Reviews searchParams={searchParams} />
    </Suspense>
  );
}

async function Reviews({ searchParams }: Pick<PageProps<"/admin/reviews">, "searchParams">) {
  await requirePermission("reviews.moderate", "/admin/reviews");
  const tab = String((await searchParams).tab ?? "pending");
  const where: Prisma.ReviewWhereInput =
    tab === "reported"
      ? { reports: { some: { resolved: false } } }
      : { status: tab === "approved" ? "APPROVED" : tab === "rejected" ? "REJECTED" : "PENDING" };
  const [reviews, counts] = await Promise.all([
    db.review.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        product: { select: { name: true, slug: true } },
        images: true,
        reports: { where: { resolved: false } },
        user: { select: { email: true } },
      },
    }),
    Promise.all([db.review.count({ where: { status: "PENDING" } }), db.review.count({ where: { reports: { some: { resolved: false } } } })]),
  ]);
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Reviews"
        description="Publish genuine reviews — positive or negative. Only reject reviews that are fake, abusive, off-topic, contain personal data or break the law (see the Review Policy)."
      />
      <nav className="flex flex-wrap gap-2" aria-label="Review status">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/reviews?tab=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className="rounded-full border border-sand-deep px-4 py-1.5 text-sm aria-[current=page]:bg-chocolate aria-[current=page]:text-linen"
          >
            {t.label}
            {t.key === "pending" && counts[0] > 0 && ` (${counts[0]})`}
            {t.key === "reported" && counts[1] > 0 && ` (${counts[1]})`}
          </Link>
        ))}
      </nav>
      <ul className="space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-[3px] border border-sand bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href={`/products/${r.product.slug}`} target="_blank" className="font-semibold hover:underline">
                {r.product.name} ↗
              </Link>
              <span className="flex items-center gap-2 text-xs text-bark">
                {r.verifiedPurchase ? <Badge tone="success">Verified purchase</Badge> : <Badge tone="neutral">Not verified</Badge>}
                {r.authorName} · {r.user?.email ?? "deleted account"} · {dt.format(r.createdAt)}
                {r.editedAt && " · edited"}
              </span>
            </div>
            <StarRating average={r.rating} count={1} showCount={false} className="mt-2" />
            <p className="mt-2 font-semibold">{r.title}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-bark">{r.body}</p>
            {r.images.length > 0 && (
              <ul className="mt-3 flex gap-2">
                {r.images.map((i) => (
                  <li key={i.id} className="size-20 overflow-hidden rounded bg-sand">
                    {/* eslint-disable-next-line @next/next/no-img-element -- moderation preview */}
                    <img src={i.url} alt={i.alt} className="h-full w-full object-cover" />
                  </li>
                ))}
              </ul>
            )}
            {r.reports.length > 0 && (
              <ul className="mt-3 rounded-[2px] bg-danger/5 p-3 text-xs text-danger">
                {r.reports.map((rep) => (
                  <li key={rep.id}>Reported: {rep.reason}</li>
                ))}
              </ul>
            )}
            {r.moderationNote && <p className="mt-2 text-xs text-bark">Note: {r.moderationNote}</p>}
            <AdminForm action={moderateReviewAction} className="mt-4 flex flex-wrap items-end gap-3 border-t border-sand pt-4">
              <input type="hidden" name="id" value={r.id} />
              <F label="Moderation note (required to reject)" name="moderationNote" className="min-w-72 flex-1" />
              {r.status !== "APPROVED" && (
                <button
                  name="status"
                  value="APPROVED"
                  className="h-10 rounded-[2px] bg-olive px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white"
                >
                  Publish
                </button>
              )}
              {r.status !== "REJECTED" && (
                <button
                  name="status"
                  value="REJECTED"
                  className="h-10 rounded-[2px] border border-danger px-4 text-xs font-semibold uppercase tracking-[0.12em] text-danger"
                >
                  Reject
                </button>
              )}
              {r.status === "APPROVED" && r.reports.length > 0 && (
                <button
                  name="status"
                  value="APPROVED"
                  className="h-10 rounded-[2px] border border-chocolate/70 px-4 text-xs font-semibold uppercase tracking-[0.12em]"
                >
                  Keep published
                </button>
              )}
            </AdminForm>
          </li>
        ))}
        {!reviews.length && <li className="rounded-[3px] border border-sand bg-white p-8 text-center text-sm text-bark">Nothing here right now.</li>}
      </ul>
    </div>
  );
}
