import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { saveArtisanAction, uploadArtisanPhotoAction, uploadDocumentAction } from "../actions";
import { SupplierForm } from "../supplier-form";
import { AdminForm, F, FArea, FSelect, Submit } from "@/components/admin/admin-form";
import { AdminHeader, AdminSkeleton, Card } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { isoDate } from "@/server/admin/sourcing";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";

export const metadata = { title: "Supplier" };
const DOC_KINDS = [
  "Supplier invoice",
  "Packing list",
  "Origin statement (DCTS)",
  "C79 import VAT certificate",
  "Customs declaration",
  "Test certificate",
  "Contract",
  "Other",
];
type Artisan = Awaited<ReturnType<typeof db.artisan.findMany>>[number];

function ArtisanForm({ supplierId, a }: { supplierId: string; a?: Artisan }) {
  return (
    <AdminForm action={saveArtisanAction} resetOnSuccess={!a} className="grid gap-3 md:grid-cols-2">
      {a && <input type="hidden" name="id" value={a.id} />}
      <input type="hidden" name="supplierId" value={supplierId} />
      <F label="Display name" name="displayName" defaultValue={a?.displayName} />
      <F label="Craft" name="craft" defaultValue={a?.craft} placeholder="e.g. Dhaka weaving" />
      <F label="Region" name="region" defaultValue={a?.region ?? ""} />
      <F label="Consent date" name="consentDate" type="date" defaultValue={isoDate(a?.consentDate)} />
      <FArea label="Story (in their words, with permission)" name="story" defaultValue={a?.story ?? ""} rows={3} className="md:col-span-2" />
      <F
        type="checkbox"
        label="Written consent to publish name, story and photo"
        name="consentToPublish"
        defaultValue={a?.consentToPublish ? "1" : ""}
        className="md:col-span-2"
      />
      <Submit variant={a ? "outline" : "primary"} className="md:justify-self-start">
        {a ? "Save artisan" : "Add artisan"}
      </Submit>
    </AdminForm>
  );
}

export default function SupplierPage({ params }: PageProps<"/admin/suppliers/[id]">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Supplier params={params} />
    </Suspense>
  );
}

async function Supplier({ params }: Pick<PageProps<"/admin/suppliers/[id]">, "params">) {
  await requirePermission("sourcing.manage", "/admin/suppliers");
  const { id } = await params;
  const s = await db.supplier.findUnique({
    where: { id: id.slice(0, 40) },
    include: {
      artisans: true,
      documents: { orderBy: { createdAt: "desc" } },
      purchaseOrders: { orderBy: { createdAt: "desc" } },
      products: { select: { id: true, name: true } },
    },
  });
  if (!s) notFound();
  return (
    <div className="space-y-6">
      <AdminHeader
        title={s.name}
        back={{ href: "/admin/suppliers", label: "Suppliers" }}
        actions={
          <ButtonLink href={`/admin/purchase-orders/new?supplier=${s.id}`} size="sm">
            New purchase order
          </ButtonLink>
        }
      />
      <Card title="Details">
        <SupplierForm s={s} />
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title={`Purchase orders (${s.purchaseOrders.length})`}>
          <ul className="divide-y divide-sand text-sm">
            {s.purchaseOrders.map((p) => (
              <li key={p.id} className="flex justify-between py-2">
                <Link href={`/admin/purchase-orders/${p.id}`} className="font-semibold hover:underline">
                  PO-{p.poNumber}
                </Link>
                <Badge tone={p.status === "RECEIVED" ? "success" : "neutral"}>{p.status.toLowerCase().replace("_", " ")}</Badge>
              </li>
            ))}
            {!s.purchaseOrders.length && <li className="py-2 text-bark">None yet.</li>}
          </ul>
        </Card>
        <Card title={`Products (${s.products.length})`}>
          <ul className="space-y-1 text-sm">
            {s.products.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="hover:underline">
                  {p.name}
                </Link>
              </li>
            ))}
            {!s.products.length && <li className="text-bark">Link products to this supplier from the product form.</li>}
          </ul>
        </Card>
      </div>
      <Card title="Documents (private)">
        <ul className="mb-4 divide-y divide-sand text-sm">
          {s.documents.map((d) => (
            <li key={d.id} className="flex justify-between py-2">
              <a href={`/api/admin/documents/${d.id}`} target="_blank" className="underline">
                {d.fileName}
              </a>
              <span className="text-bark">{d.kind}</span>
            </li>
          ))}
          {!s.documents.length && <li className="py-2 text-bark">No documents uploaded.</li>}
        </ul>
        <AdminForm action={uploadDocumentAction} resetOnSuccess className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="supplierId" value={s.id} />
          <FSelect label="Type" name="kind" options={DOC_KINDS.map((k) => ({ value: k, label: k }))} />
          <input type="file" name="file" accept="application/pdf,image/jpeg,image/png" className="text-sm" />
          <Submit variant="dark">Upload</Submit>
        </AdminForm>
      </Card>
      <Card title="Artisan profiles">
        <p className="mb-4 text-sm text-bark">Profiles only appear on the website when written consent is recorded.</p>
        <ul className="space-y-4">
          {s.artisans.map((a) => (
            <li key={a.id} className="rounded-[2px] border border-sand p-4">
              <ArtisanForm supplierId={s.id} a={a} />
              <AdminForm action={uploadArtisanPhotoAction} className="mt-3 flex flex-wrap items-end gap-3 border-t border-sand pt-3">
                <input type="hidden" name="id" value={a.id} />
                {a.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- admin preview
                  <img src={a.photoUrl} alt="" className="size-16 rounded object-cover" />
                )}
                <input type="file" name="file" accept="image/jpeg,image/png,image/webp" className="text-sm" />
                <Submit variant="outline">Upload photo</Submit>
              </AdminForm>
            </li>
          ))}
        </ul>
        <details className="mt-4 rounded-[2px] border border-dashed border-sand-deep p-4">
          <summary className="cursor-pointer text-sm font-semibold">+ Add an artisan</summary>
          <div className="mt-3">
            <ArtisanForm supplierId={s.id} />
          </div>
        </details>
      </Card>
    </div>
  );
}
