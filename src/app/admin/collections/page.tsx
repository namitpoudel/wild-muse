import { Suspense } from "react";
import { deleteCategoryAction, deleteCollectionAction, saveCategoryAction, saveCollectionAction, uploadCollectionImageAction } from "./actions";
import { AdminForm, F, FArea, FSelect, Submit } from "@/components/admin/admin-form";
import { AdminHeader, AdminSkeleton, Card } from "@/components/admin/ui";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";

export const metadata = { title: "Categories & collections" };
const DEPTS = [
  { value: "WOMEN", label: "Women" },
  { value: "MEN", label: "Men" },
  { value: "KIDS", label: "Kids" },
  { value: "ACCESSORIES", label: "Jewellery & Accessories" },
];
const TONES = ["terracotta", "olive", "sand", "chocolate", "mustard", "cream"].map((t) => ({ value: t, label: t }));
const KINDS = ["dress", "top", "shirt", "trousers", "jacket", "knit", "bag", "necklace", "earrings", "scarf", "hat", "landscape", "loom"].map(
  (t) => ({ value: t, label: t }),
);

export default function CollectionsPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Content />
    </Suspense>
  );
}

type CategoryRow = Awaited<ReturnType<typeof db.category.findMany>>[number];
type CollectionRow = Awaited<ReturnType<typeof db.collection.findMany>>[number];

function CategoryForm({ c }: { c?: CategoryRow }) {
  return (
    <AdminForm action={saveCategoryAction} resetOnSuccess={!c} className="grid gap-3 sm:grid-cols-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      <F label="Name" name="name" defaultValue={c?.name} />
      <FSelect label="Department" name="department" defaultValue={c?.department ?? "WOMEN"} options={DEPTS} />
      <F label="Menu column" name="groupName" defaultValue={c?.groupName} hint="e.g. Dresses, Tops & Layers, Bottoms" />
      <F label="URL slug" name="slug" defaultValue={c?.slug} hint="Blank = from name" />
      <F label="Sort order" name="sortOrder" type="number" defaultValue={c?.sortOrder ?? 0} />
      <F type="checkbox" label="Visible in menus" name="isActive" defaultValue={!c || c.isActive ? "1" : ""} />
      <FArea label="Intro text" name="description" defaultValue={c?.description ?? ""} rows={2} className="sm:col-span-2" />
      <F label="SEO title" name="seoTitle" defaultValue={c?.seoTitle ?? ""} />
      <F label="Meta description" name="seoDescription" defaultValue={c?.seoDescription ?? ""} />
      <Submit className="sm:col-span-2 sm:justify-self-start">{c ? "Save category" : "Add category"}</Submit>
    </AdminForm>
  );
}

function CollectionForm({ c }: { c?: CollectionRow }) {
  return (
    <AdminForm action={saveCollectionAction} resetOnSuccess={!c} className="grid gap-3 sm:grid-cols-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      <F label="Name" name="name" defaultValue={c?.name} />
      <F label="URL slug" name="slug" defaultValue={c?.slug} hint="Blank = from name" />
      <F label="Tagline" name="tagline" defaultValue={c?.tagline} className="sm:col-span-2" />
      <FArea label="Description" name="description" defaultValue={c?.description ?? ""} rows={2} className="sm:col-span-2" />
      <FSelect label="Placeholder illustration" name="artKind" defaultValue={c?.artKind ?? "dress"} options={KINDS} />
      <FSelect label="Placeholder colour" name="artTone" defaultValue={c?.artTone ?? "terracotta"} options={TONES} />
      <F label="Sort order" name="sortOrder" type="number" defaultValue={c?.sortOrder ?? 0} />
      <div className="space-y-2">
        <F type="checkbox" label="Featured on homepage" name="isFeatured" defaultValue={!c || c.isFeatured ? "1" : ""} />
        <F type="checkbox" label="Visible" name="isActive" defaultValue={!c || c.isActive ? "1" : ""} />
      </div>
      <F label="SEO title" name="seoTitle" defaultValue={c?.seoTitle ?? ""} />
      <F label="Meta description" name="seoDescription" defaultValue={c?.seoDescription ?? ""} />
      <Submit className="sm:col-span-2 sm:justify-self-start">{c ? "Save collection" : "Add collection"}</Submit>
    </AdminForm>
  );
}

async function Content() {
  await requirePermission("products.write", "/admin/collections");
  const [categories, collections, productCounts] = await Promise.all([
    db.category.findMany({ orderBy: [{ department: "asc" }, { sortOrder: "asc" }] }),
    db.collection.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } }),
    db.product.groupBy({ by: ["categoryId"], where: { deletedAt: null }, _count: true }),
  ]);
  const count = Object.fromEntries(productCounts.map((p) => [p.categoryId, p._count]));
  return (
    <div className="space-y-8">
      <AdminHeader title="Categories & collections" description="Categories build the menus and department pages; collections are curated edits." />
      <Card title="Collections">
        <ul className="divide-y divide-sand">
          {collections.map((c) => (
            <li key={c.id} className="py-3">
              <details>
                <summary className="cursor-pointer text-sm">
                  <strong>{c.name}</strong> · {c._count.products} products {!c.isActive && "· hidden"}{" "}
                  {c.imageUrl ? "· has image" : "· placeholder image"}
                </summary>
                <div className="mt-4 space-y-4 rounded-[2px] bg-cream/50 p-4">
                  <CollectionForm c={c} />
                  <AdminForm action={uploadCollectionImageAction} className="flex flex-wrap items-end gap-3 border-t border-sand pt-3">
                    <input type="hidden" name="id" value={c.id} />
                    <label className="text-sm font-semibold">
                      Collection image
                      <input type="file" name="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block text-sm" />
                    </label>
                    <Submit variant="outline">Upload image</Submit>
                  </AdminForm>
                  <AdminForm action={deleteCollectionAction} confirm={`Delete the ${c.name} collection?`}>
                    <input type="hidden" name="id" value={c.id} />
                    <Submit variant="danger">Delete collection</Submit>
                  </AdminForm>
                </div>
              </details>
            </li>
          ))}
        </ul>
        <details className="mt-4 rounded-[2px] border border-dashed border-sand-deep p-4">
          <summary className="cursor-pointer text-sm font-semibold">+ Add a collection</summary>
          <div className="mt-4">
            <CollectionForm />
          </div>
        </details>
      </Card>

      <Card title="Categories">
        {DEPTS.map((d) => (
          <div key={d.value} className="mb-6">
            <h3 className="eyebrow mb-2 text-terracotta">{d.label}</h3>
            <ul className="divide-y divide-sand rounded-[2px] border border-sand">
              {categories
                .filter((c) => c.department === d.value)
                .map((c) => (
                  <li key={c.id} className="px-3 py-2">
                    <details>
                      <summary className="cursor-pointer text-sm">
                        {c.name}{" "}
                        <span className="text-bark">
                          · {c.groupName} · {count[c.id] ?? 0} products {!c.isActive && "· hidden"}
                        </span>
                      </summary>
                      <div className="mt-3 space-y-3 rounded-[2px] bg-cream/50 p-4">
                        <CategoryForm c={c} />
                        <AdminForm action={deleteCategoryAction} confirm={`Delete ${c.name}?`}>
                          <input type="hidden" name="id" value={c.id} />
                          <Submit variant="danger">Delete category</Submit>
                        </AdminForm>
                      </div>
                    </details>
                  </li>
                ))}
            </ul>
          </div>
        ))}
        <details className="rounded-[2px] border border-dashed border-sand-deep p-4">
          <summary className="cursor-pointer text-sm font-semibold">+ Add a category or subcategory</summary>
          <div className="mt-4">
            <CategoryForm />
          </div>
        </details>
      </Card>
    </div>
  );
}
