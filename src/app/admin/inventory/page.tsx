import Link from "next/link";
import { Suspense } from "react";
import { adjustStockAction } from "./actions";
import { AdminForm, F, FSelect, Submit } from "@/components/admin/admin-form";
import { AdminHeader, AdminSkeleton, Card, FilterBar, FilterField, inputCls, Pagination, qs, Table, Td } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import type { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";

export const metadata = { title: "Inventory" };
const dt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Inventory searchParams={searchParams} />
    </Suspense>
  );
}

async function Inventory({ searchParams }: Pick<PageProps<"/admin/inventory">, "searchParams">) {
  await requirePermission("inventory.adjust", "/admin/inventory");
  const sp = (await searchParams) as Record<string, string | undefined>;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.slice(0, 80);
  const where: Prisma.ProductVariantWhereInput = {
    product: { deletedAt: null },
    ...(q ? { OR: [{ sku: { contains: q, mode: "insensitive" } }, { product: { name: { contains: q, mode: "insensitive" } } }] } : {}),
  };
  const all = await db.productVariant.findMany({
    where,
    include: { product: { select: { id: true, name: true, status: true } } },
    orderBy: [{ product: { name: "asc" } }, { sortOrder: "asc" }],
  });
  const filtered = sp.low === "1" ? all.filter((v) => v.stockOnHand - v.stockReserved <= v.lowStockThreshold) : all;
  const take = 40;
  const rows = filtered.slice((page - 1) * take, page * take);
  const pages = Math.max(1, Math.ceil(filtered.length / take));
  const selected = sp.variant
    ? await db.productVariant.findUnique({
        where: { id: sp.variant },
        include: {
          product: { select: { name: true } },
          movements: { orderBy: { createdAt: "desc" }, take: 30, include: { user: { select: { name: true } } } },
        },
      })
    : null;
  const units = all.reduce((n, v) => n + v.stockOnHand, 0);
  return (
    <div className="space-y-6">
      <AdminHeader title="Inventory" description={`${all.length} variants · ${units} units on hand`} />
      <FilterBar action="/admin/inventory">
        <FilterField label="Search">
          <input name="q" defaultValue={q} placeholder="Product or SKU" className={inputCls} />
        </FilterField>
        <label className="flex h-10 items-center gap-2 text-xs font-semibold">
          <input type="checkbox" name="low" value="1" defaultChecked={sp.low === "1"} className="accent-terracotta" /> Low stock only
        </label>
      </FilterBar>
      {selected && (
        <Card
          title={`${selected.product.name} — ${selected.colour} / ${selected.size}`}
          actions={
            <Link href={`/admin/inventory${qs(sp, { variant: undefined })}`} className="text-sm underline">
              Close
            </Link>
          }
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <AdminForm action={adjustStockAction} resetOnSuccess className="space-y-3">
              <input type="hidden" name="variantId" value={selected.id} />
              <p className="text-sm">
                On hand <strong>{selected.stockOnHand}</strong> · Reserved <strong>{selected.stockReserved}</strong> · Available{" "}
                <strong>{selected.stockOnHand - selected.stockReserved}</strong>
              </p>
              <FSelect
                label="Movement"
                name="type"
                options={[
                  { value: "RECEIVE", label: "Received stock (+)" },
                  { value: "ADJUST", label: "Stock-count correction (±)" },
                  { value: "DAMAGE", label: "Damaged / lost (−)" },
                  { value: "RETURN", label: "Customer return to stock (+)" },
                ]}
              />
              <F label="Quantity" name="quantity" type="number" hint="For corrections use a negative number to reduce stock." />
              <F label="Reason" name="reason" placeholder="e.g. Monthly stock count" />
              <F label="Low-stock alert at" name="lowStockThreshold" type="number" defaultValue={selected.lowStockThreshold} />
              <Submit>Record movement</Submit>
            </AdminForm>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Recent movements</h3>
              <ul className="max-h-80 divide-y divide-sand overflow-y-auto text-sm">
                {selected.movements.map((m) => (
                  <li key={m.id} className="flex justify-between gap-3 py-1.5">
                    <span>
                      <span className="font-mono text-xs">{m.type}</span> {m.reason}
                      <span className="block text-xs text-bark">
                        {dt.format(m.createdAt)}
                        {m.user && ` · ${m.user.name}`}
                      </span>
                    </span>
                    <span className={m.quantity >= 0 ? "text-success" : "text-danger"}>
                      {m.quantity > 0 ? "+" : ""}
                      {m.quantity}
                    </span>
                  </li>
                ))}
                {!selected.movements.length && <li className="py-2 text-bark">No movements yet.</li>}
              </ul>
            </div>
          </div>
        </Card>
      )}
      <Table head={["Product", "Variant", "SKU", "On hand", "Reserved", "Available", ""]}>
        {rows.map((v) => {
          const available = v.stockOnHand - v.stockReserved;
          return (
            <tr key={v.id} className={selected?.id === v.id ? "bg-cream" : "hover:bg-cream/40"}>
              <Td>
                <Link href={`/admin/products/${v.product.id}`} className="hover:underline">
                  {v.product.name}
                </Link>
                {!v.isActive && <span className="ml-1 text-xs text-bark">(inactive)</span>}
              </Td>
              <Td>
                {v.colour} / {v.size}
              </Td>
              <Td className="font-mono text-xs">{v.sku}</Td>
              <Td>{v.stockOnHand}</Td>
              <Td>{v.stockReserved}</Td>
              <Td>
                <Badge tone={available === 0 ? "danger" : available <= v.lowStockThreshold ? "warning" : "success"}>{available}</Badge>
              </Td>
              <Td>
                <Link href={`/admin/inventory${qs(sp, { variant: v.id })}`} className="text-sm font-semibold underline">
                  Adjust
                </Link>
              </Td>
            </tr>
          );
        })}
      </Table>
      <Pagination page={page} pages={pages} href={(n) => `/admin/inventory${qs(sp, { page: n })}`} />
    </div>
  );
}
