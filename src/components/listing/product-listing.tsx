"use client";

import { SearchX, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import type { Product } from "@/lib/catalog/types";
import { formatPence } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface Facets {
  sizes: string[];
  colours: { name: string; hex: string }[];
  materials: string[];
  price: { min: number; max: number };
}

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "bestselling", label: "Best sellers" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

const PRICE_BANDS = [
  { value: "0-30", label: "Under £30", min: 0, max: 3000 },
  { value: "30-60", label: "£30 – £60", min: 3000, max: 6000 },
  { value: "60-100", label: "£60 – £100", min: 6000, max: 10000 },
  { value: "100-", label: "£100 and over", min: 10000, max: Infinity },
];

/**
 * Product grid with combinable filters stored in the URL (shareable, back-button friendly).
 * Stage 2/3: filters the products passed in. Stage 4: the same URL params drive a
 * paginated server-side Postgres query; this component's UI is unchanged.
 */
export function ProductListing({ products, facets }: { products: Product[]; facets: Facets }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);

  const list = (k: string) => params.get(k)?.split(",").filter(Boolean) ?? [];
  const sel = {
    size: list("size"),
    colour: list("colour"),
    material: list("material"),
    price: list("price"),
    inStock: params.get("instock") === "1",
    sale: params.get("sale") === "1",
    sort: params.get("sort") ?? "featured",
  };

  function update(mutator: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mutator(next);
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }
  const toggle = (key: string, value: string) =>
    update((p) => {
      const cur = new Set(p.get(key)?.split(",").filter(Boolean) ?? []);
      if (cur.has(value)) cur.delete(value);
      else cur.add(value);
      if (cur.size) p.set(key, [...cur].join(","));
      else p.delete(key);
    });
  const setFlag = (key: string, on: boolean) => update((p) => (on ? p.set(key, "1") : p.delete(key)));
  const clearAll = () => update((p) => ["size", "colour", "material", "price", "instock", "sale"].forEach((k) => p.delete(k)));

  const results = (() => {
    const filtered = products.filter((p) => {
      const inStockVariants = p.variants.filter((v) => v.stock > 0);
      if (sel.size.length && !p.variants.some((v) => sel.size.includes(v.size) && (!sel.inStock || v.stock > 0))) return false;
      if (sel.colour.length && !p.colours.some((c) => sel.colour.includes(c.name))) return false;
      if (sel.material.length && !sel.material.some((m) => p.fibreComposition.toLowerCase().includes(m.toLowerCase()))) return false;
      if (sel.price.length) {
        const bands = PRICE_BANDS.filter((b) => sel.price.includes(b.value));
        if (!bands.some((b) => p.pricePence >= b.min && p.pricePence < b.max)) return false;
      }
      if (sel.inStock && inStockVariants.length === 0) return false;
      if (sel.sale && !(p.compareAtPricePence && p.compareAtPricePence > p.pricePence)) return false;
      return true;
    });
    const sorted = [...filtered];
    switch (sel.sort) {
      case "newest":
        sorted.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
        break;
      case "bestselling":
        sorted.sort((a, b) => (a.bestsellerRank ?? 999) - (b.bestsellerRank ?? 999));
        break;
      case "price-asc":
        sorted.sort((a, b) => a.pricePence - b.pricePence);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.pricePence - a.pricePence);
        break;
    }
    return sorted;
  })();

  const chips = [
    ...sel.size.map((v) => ({ key: "size", v, label: `Size ${v}` })),
    ...sel.colour.map((v) => ({ key: "colour", v, label: v })),
    ...sel.material.map((v) => ({ key: "material", v, label: v })),
    ...sel.price.map((v) => ({ key: "price", v, label: PRICE_BANDS.find((b) => b.value === v)?.label ?? v })),
    ...(sel.inStock ? [{ key: "instock", v: "", label: "In stock" }] : []),
    ...(sel.sale ? [{ key: "sale", v: "", label: "On sale" }] : []),
  ];

  const filters = <FilterPanel facets={facets} sel={sel} toggle={toggle} setFlag={setFlag} />;

  return (
    <div className="container-page py-8 md:py-12">
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-sand pb-4">
        <p className="text-sm text-bark" aria-live="polite">
          <strong className="text-chocolate">{results.length}</strong> {results.length === 1 ? "product" : "products"}
        </p>
        <div className="flex items-center gap-2">
          <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal /> Filter{chips.length ? ` (${chips.length})` : ""}
              </Button>
            </DialogTrigger>
            <SheetContent title="Filter" side="left">
              <div className="flex-1 overflow-y-auto px-5 py-2">{filters}</div>
              <div className="grid grid-cols-2 gap-2 border-t border-sand p-4">
                <Button variant="outline" onClick={clearAll} disabled={!chips.length}>
                  Clear all
                </Button>
                <Button variant="dark" onClick={() => setSheetOpen(false)}>
                  Show {results.length}
                </Button>
              </div>
            </SheetContent>
          </Dialog>
          <label className="flex items-center gap-2 text-sm">
            <span className="hidden text-bark sm:inline">Sort by</span>
            <select
              value={sel.sort}
              onChange={(e) => update((p) => (e.target.value === "featured" ? p.delete("sort") : p.set("sort", e.target.value)))}
              className="h-9 rounded-[2px] border border-sand-deep bg-linen px-2 text-sm font-semibold"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="mb-6 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map((c) => (
            <li key={`${c.key}-${c.v}`}>
              <button
                type="button"
                onClick={() => (c.v ? toggle(c.key, c.v) : setFlag(c.key, false))}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-sand px-3 text-xs font-semibold hover:bg-sand-deep"
                aria-label={`Remove filter: ${c.label}`}
              >
                {c.label} <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={clearAll} className="text-xs font-semibold underline underline-offset-4">
              Clear all
            </button>
          </li>
        </ul>
      )}

      <div className="grid gap-10 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block" aria-label="Product filters">
          {filters}
        </aside>
        {results.length ? (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3">
            {results.map((p, i) => (
              <li key={p.id}>
                <ProductCard product={p} priority={i < 3} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={SearchX}
            title="No matches — yet"
            action={
              <Button variant="dark" onClick={clearAll}>
                Clear filters
              </Button>
            }
          >
            Try removing a filter or two. New handmade pieces arrive regularly.
          </EmptyState>
        )}
      </div>
    </div>
  );
}

function FilterPanel({
  facets,
  sel,
  toggle,
  setFlag,
}: {
  facets: Facets;
  sel: { size: string[]; colour: string[]; material: string[]; price: string[]; inStock: boolean; sale: boolean };
  toggle: (k: string, v: string) => void;
  setFlag: (k: string, on: boolean) => void;
}) {
  const bands = PRICE_BANDS.filter((b) => b.min <= facets.price.max && b.max > facets.price.min);
  return (
    <div className="divide-y divide-sand">
      <FilterGroup title="Availability">
        <Toggle label="In stock only" checked={sel.inStock} onChange={(v) => setFlag("instock", v)} />
        <Toggle label="On sale" checked={sel.sale} onChange={(v) => setFlag("sale", v)} />
      </FilterGroup>
      {facets.sizes.length > 1 && (
        <FilterGroup title="Size">
          <div className="flex flex-wrap gap-1.5">
            {facets.sizes.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={sel.size.includes(s)}
                onClick={() => toggle("size", s)}
                className={cn(
                  "h-9 min-w-10 rounded-[2px] border px-2.5 text-xs font-semibold transition-colors",
                  sel.size.includes(s) ? "border-chocolate bg-chocolate text-linen" : "border-sand-deep hover:border-chocolate",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}
      <FilterGroup title="Colour">
        <div className="grid grid-cols-2 gap-2">
          {facets.colours.map((c) => (
            <button
              key={c.name}
              type="button"
              aria-pressed={sel.colour.includes(c.name)}
              onClick={() => toggle("colour", c.name)}
              className={cn(
                "flex items-center gap-2 rounded-[2px] px-1.5 py-1 text-left text-sm",
                sel.colour.includes(c.name) && "bg-sand font-semibold",
              )}
            >
              <span className="size-4 shrink-0 rounded-full ring-1 ring-chocolate/20" style={{ backgroundColor: c.hex }} aria-hidden />
              {c.name}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Material">
        {facets.materials.map((m) => (
          <Toggle key={m} label={m} checked={sel.material.includes(m)} onChange={() => toggle("material", m)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Price">
        {bands.map((b) => (
          <Toggle key={b.value} label={b.label} checked={sel.price.includes(b.value)} onChange={() => toggle("price", b.value)} />
        ))}
        <p className="pt-1 text-xs text-bark">
          From {formatPence(facets.price.min)} to {formatPence(facets.price.max)}
        </p>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="py-5 first:pt-0">
      <legend className="eyebrow mb-3 text-chocolate">{title}</legend>
      <div className="space-y-2">{children}</div>
    </fieldset>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-terracotta" />
      {label}
    </label>
  );
}
