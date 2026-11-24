import Link from "next/link";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { removeDemoProductsAction } from "./actions";
import { AdminForm, F, Submit } from "@/components/admin/admin-form";
import { AdminHeader, AdminSkeleton, FilterBar, FilterField, inputCls, Pagination, qs, Table, Td } from "@/components/admin/ui";
import { Artwork } from "@/components/brand/artwork";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import type { ArtworkKind, ArtworkTone } from "@/lib/catalog/types";
import { formatPenceExact } from "@/lib/money";
import { listProducts } from "@/server/admin/products";
import { can } from "@/server/auth/permissions";
import { requirePermission } from "@/server/auth/session";

export const metadata = { title: "Products" };

export default function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Products searchParams={searchParams} />
    </Suspense>
  );
}

const STATUS_TONE = { PUBLISHED: "success", DRAFT: "neutral", ARCHIVED: "danger" } as const;

async function Products({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  const user = await requirePermission("products.view", "/admin/products");
  const sp = (await searchParams) as Record<string, string | undefined>;
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total, pages } = await listProducts({ q: sp.q?.slice(0, 80), status: sp.status, dept: sp.dept, demo: sp.demo === "1", page });
  const canWrite = can(user.role, "products.write");
  return (
    <div>
      <AdminHeader
        title="Products"
        description={`${total} product${total === 1 ? "" : "s"}`}
        actions={
          canWrite && (
            <ButtonLink href="/admin/products/new" size="sm">
              <Plus /> Add product
            </ButtonLink>
          )
        }
      />
      <FilterBar action="/admin/products">
        <FilterField label="Search">
          <input name="q" defaultValue={sp.q} placeholder="Name or SKU" className={inputCls} />
        </FilterField>
        <FilterField label="Status">
          <select name="status" defaultValue={sp.status ?? ""} className={inputCls}>
            <option value="">All</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </FilterField>
        <FilterField label="Department">
          <select name="dept" defaultValue={sp.dept ?? ""} className={inputCls}>
            <option value="">All</option>
            <option value="WOMEN">Women</option>
            <option value="MEN">Men</option>
            <option value="KIDS">Kids</option>
            <option value="ACCESSORIES">Accessories</option>
          </select>
        </FilterField>
        <label className="flex h-10 items-center gap-2 text-xs font-semibold">
          <input type="checkbox" name="demo" value="1" defaultChecked={sp.demo === "1"} className="accent-terracotta" /> Demo only
        </label>
      </FilterBar>
      <Table head={["", "Product", "Category", "Price", "Stock", "Status"]}>
        {rows.map((p) => {
          const stock = p.variants.filter((v) => v.isActive).reduce((n, v) => n + v.stockOnHand - v.stockReserved, 0);
          return (
            <tr key={p.id} className="hover:bg-cream/40">
              <Td className="w-14">
                <div className="h-14 w-11 overflow-hidden rounded-[2px] bg-sand">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
                    <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Artwork kind={p.artKind as ArtworkKind} tone={(p.artTones[0] ?? "sand") as ArtworkTone} label="" band={false} />
                  )}
                </div>
              </Td>
              <Td>
                <Link href={`/admin/products/${p.id}`} className="font-semibold hover:underline">
                  {p.name}
                </Link>
                <span className="block text-xs text-bark">
                  {p.isDemo && "Demo · "}
                  {p.isHandmade && "Handmade · "}/{p.slug}
                </span>
              </Td>
              <Td>{p.category.name}</Td>
              <Td>
                {formatPenceExact(p.pricePence)}
                {p.compareAtPricePence && <s className="ml-1 text-xs text-bark">{formatPenceExact(p.compareAtPricePence)}</s>}
              </Td>
              <Td>
                <Badge tone={stock === 0 ? "danger" : stock < 5 ? "warning" : "success"}>{stock} available</Badge>
              </Td>
              <Td>
                <Badge tone={STATUS_TONE[p.status]}>{p.status.toLowerCase()}</Badge>
              </Td>
            </tr>
          );
        })}
      </Table>
      {!rows.length && <p className="p-6 text-center text-sm text-bark">No products match these filters.</p>}
      <Pagination page={page} pages={pages} href={(n) => `/admin/products${qs(sp, { page: n })}`} />

      {can(user.role, "products.delete") && sp.demo === "1" && rows.length > 0 && (
        <section className="mt-8 rounded-[3px] border border-danger/30 bg-white p-5">
          <h2 className="font-display text-xl">Remove all demo products</h2>
          <p className="mt-1 text-sm text-bark">
            Deletes the demo catalogue used during development. Any demo product with orders is archived instead.
          </p>
          <AdminForm action={removeDemoProductsAction} confirm="Remove all demo products?" className="mt-3 flex flex-wrap items-end gap-3">
            <F label="Type DELETE DEMO to confirm" name="confirm" />
            <Submit variant="danger">Remove demo products</Submit>
          </AdminForm>
        </section>
      )}
    </div>
  );
}
