import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageEditor } from "@/components/admin/page-editor";
import { AdminHeader, AdminSkeleton } from "@/components/admin/ui";
import { blocksToText } from "@/lib/content/markdown";
import type { ContentBlock } from "@/lib/content/types";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";
import { HomepageEditor } from "../homepage-editor";

export const metadata = { title: "Edit page" };

export default function EditContentPage({ params }: PageProps<"/admin/content/[id]">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Pick<PageProps<"/admin/content/[id]">, "params">) {
  await requirePermission("content.manage", "/admin/content");
  const { id } = await params;
  if (id === "homepage") return <HomepageEditor />;
  if (id === "new")
    return (
      <div>
        <AdminHeader title="New page" back={{ href: "/admin/content", label: "Pages" }} />
        <PageEditor page={{ title: "", eyebrow: "", summary: "", description: "", body: "", requiresLegalReview: false, status: "DRAFT" }} />
      </div>
    );
  const p = await db.contentPage.findUnique({ where: { id: id.slice(0, 40) } });
  if (!p) notFound();
  const [section, slug] = p.path.split("/");
  return (
    <div>
      <AdminHeader title={p.title} back={{ href: "/admin/content", label: "Pages" }} />
      <PageEditor
        page={{
          id: p.id,
          path: p.path,
          title: p.title,
          eyebrow: p.eyebrow ?? "",
          summary: p.summary ?? "",
          description: p.description,
          body: blocksToText(p.blocks as unknown as ContentBlock[]),
          requiresLegalReview: p.requiresLegalReview,
          status: p.status,
          publicUrl: section === "handmade" ? `/handmade-in-nepal/${slug}` : `/pages/${slug}`,
        }}
      />
    </div>
  );
}
