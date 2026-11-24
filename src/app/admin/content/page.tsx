import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader, AdminSkeleton, Card } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";

export const metadata = { title: "Pages & policies" };
const dt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function ContentPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Pages />
    </Suspense>
  );
}

async function Pages() {
  await requirePermission("content.manage", "/admin/content");
  const pages = await db.contentPage.findMany({ orderBy: [{ path: "asc" }] });
  const groups = [
    { title: "Information & policy pages", prefix: "pages/", base: "/pages/" },
    { title: "Handmade in Nepal stories", prefix: "handmade/", base: "/handmade-in-nepal/" },
  ];
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Pages & policies"
        description="Edit About, Delivery, Returns, Privacy, FAQs and the Handmade in Nepal stories."
        actions={
          <>
            <ButtonLink href="/admin/content/homepage" variant="outline" size="sm">
              Homepage & announcements
            </ButtonLink>
            <ButtonLink href="/admin/content/new" size="sm">
              New page
            </ButtonLink>
          </>
        }
      />
      {groups.map((g) => (
        <Card key={g.prefix} title={g.title}>
          <ul className="divide-y divide-sand">
            {pages
              .filter((p) => p.path.startsWith(g.prefix))
              .map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <span>
                    <Link href={`/admin/content/${p.id}`} className="font-semibold hover:underline">
                      {p.title}
                    </Link>
                    <span className="block text-xs text-bark">
                      {g.base}
                      {p.path.slice(g.prefix.length)} · updated {dt.format(p.updatedAt)}
                    </span>
                  </span>
                  <span className="flex gap-2">
                    {p.requiresLegalReview && <Badge tone="warning">Needs legal review</Badge>}
                    <Badge tone={p.status === "PUBLISHED" ? "success" : "neutral"}>{p.status.toLowerCase()}</Badge>
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
