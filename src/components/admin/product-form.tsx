"use client";

import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteProductAction, editProductMediaAction, saveProductAction, uploadProductMediaAction } from "@/app/admin/products/actions";
import { AdminForm, F, FArea, FieldError, FSelect, Submit } from "./admin-form";

export interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  department: string;
  categoryId: string;
  status: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAt: string;
  fibreComposition: string;
  materials: string;
  care: string;
  countryOfOrigin: string;
  commodityCode: string;
  isHandmade: boolean;
  craftStory: string;
  isFeatured: boolean;
  bestsellerRank: string;
  sizeGuide: string;
  taxClassId: string;
  supplierId: string;
  unitCost: string;
  complianceChecked: boolean;
  seoTitle: string;
  seoDescription: string;
  artKind: string;
  artTones: string;
  collectionIds: string[];
  colours: { name: string; hex: string }[];
  variants: { id?: string; colour: string; size: string; sku: string; stock: number; reserved?: number; price: string; isActive: boolean }[];
  images: { id: string; url: string; alt: string; type: string }[];
  isDemo?: boolean;
}

interface Options {
  categories: { id: string; name: string; department: string }[];
  collections: { id: string; name: string }[];
  taxClasses: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
}

const DEPTS = [
  { value: "WOMEN", label: "Women" },
  { value: "MEN", label: "Men" },
  { value: "KIDS", label: "Kids" },
  { value: "ACCESSORIES", label: "Jewellery & Accessories" },
];
const SIZE_PRESETS: Record<string, string[]> = {
  "Women UK 6–18": ["6", "8", "10", "12", "14", "16", "18"],
  "XS–XL": ["XS", "S", "M", "L", "XL"],
  "Men S–XXL": ["S", "M", "L", "XL", "XXL"],
  "Kids 2–11Y": ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y"],
  "One size": ["One size"],
};
const card = "rounded-[3px] border border-sand bg-white p-5 shadow-soft space-y-4";

export function ProductForm({ initial, options }: { initial: ProductFormData; options: Options }) {
  const router = useRouter();
  const [dept, setDept] = useState(initial.department);
  const [colours, setColours] = useState(initial.colours.length ? initial.colours : [{ name: "Natural", hex: "#EFE6D6" }]);
  const [sizes, setSizes] = useState<string[]>(() => {
    const s = [...new Set(initial.variants.map((v) => v.size))];
    return s.length ? s : ["One size"];
  });
  const [variants, setVariants] = useState(initial.variants);
  const [newSize, setNewSize] = useState("");

  const cats = options.categories.filter((c) => c.department === dept);
  const key = (c: string, s: string) => `${c}|${s}`;
  const vmap = useMemo(() => new Map(variants.map((v) => [key(v.colour, v.size), v])), [variants]);

  // The matrix always shows every colour × size; absent combinations default to stock 0.
  const matrix = colours.flatMap((c) =>
    sizes.map((s) => vmap.get(key(c.name, s)) ?? { colour: c.name, size: s, sku: "", stock: 0, price: "", isActive: true }),
  );
  const updateVariant = (c: string, s: string, patch: Partial<ProductFormData["variants"][number]>) => {
    setVariants((prev) => {
      const existing = prev.find((v) => v.colour === c && v.size === s);
      if (existing) return prev.map((v) => (v === existing ? { ...v, ...patch } : v));
      return [...prev, { colour: c, size: s, sku: "", stock: 0, price: "", isActive: true, ...patch }];
    });
  };
  const variantsJson = JSON.stringify(
    matrix.map((v) => ({
      id: v.id,
      colour: v.colour,
      size: v.size,
      sku: v.sku || undefined,
      stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
      pricePence: v.price ? Math.round(Number(v.price) * 100) : null,
      isActive: v.isActive,
    })),
  );
  const total = matrix.filter((v) => v.isActive).reduce((n, v) => n + (Number(v.stock) || 0), 0);

  return (
    <div className="space-y-6">
      <AdminForm
        action={saveProductAction}
        className="grid gap-6 xl:grid-cols-3"
        onSuccess={(d: unknown) => {
          const res = d as { id: string };
          if (!initial.id) router.push(`/admin/products/${res.id}`);
        }}
      >
        {initial.id && <input type="hidden" name="id" value={initial.id} />}
        <input type="hidden" name="colours" value={JSON.stringify(colours)} />
        <input type="hidden" name="variants" value={variantsJson} />

        <div className="space-y-6 xl:col-span-2">
          <section className={card}>
            <h2 className="font-display text-xl">Basics</h2>
            <F label="Product name" name="name" defaultValue={initial.name} required maxLength={120} />
            <F
              label="URL slug"
              name="slug"
              defaultValue={initial.slug}
              hint="Leave blank to generate from the name. Changing it changes the product's web address."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FSelect
                label="Department"
                name="department"
                defaultValue={initial.department}
                options={DEPTS}
                onChange={(e) => setDept(e.target.value)}
              />
              <FSelect
                label="Category"
                name="categoryId"
                defaultValue={initial.categoryId}
                options={[{ value: "", label: "Choose…" }, ...cats.map((c) => ({ value: c.id, label: c.name }))]}
              />
            </div>
            <FArea
              label="Short description"
              name="shortDescription"
              defaultValue={initial.shortDescription}
              rows={2}
              maxLength={240}
              hint="Shown under the price and in search results."
            />
            <FArea label="Full description" name="description" defaultValue={initial.description} rows={6} maxLength={5000} />
          </section>

          <section className={card}>
            <h2 className="font-display text-xl">Materials, care & origin</h2>
            <F
              label="Fibre composition"
              name="fibreComposition"
              defaultValue={initial.fibreComposition}
              hint="UK textile labelling: list every fibre with % using legal fibre names, e.g. '55% hemp, 45% cotton'."
            />
            <F label="Materials (customer-friendly)" name="materials" defaultValue={initial.materials} />
            <FArea label="Care instructions (one per line)" name="care" defaultValue={initial.care} rows={4} />
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="Country of origin" name="countryOfOrigin" defaultValue={initial.countryOfOrigin} />
              <F
                label="Commodity code"
                name="commodityCode"
                defaultValue={initial.commodityCode}
                hint="UK Trade Tariff code for imports, e.g. 6204420000"
              />
            </div>
            <F type="checkbox" label="Handmade" name="isHandmade" defaultValue={initial.isHandmade ? "1" : ""} />
            <FArea
              label="Craft story"
              name="craftStory"
              defaultValue={initial.craftStory}
              rows={3}
              hint="Only describe what your supplier can evidence."
            />
          </section>

          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl">Colours, sizes & stock</h2>
              <p className="text-sm text-bark">{total} units in stock</p>
            </div>
            <FieldError name="variants" />
            <div>
              <p className="mb-2 text-sm font-semibold">Colours</p>
              <ul className="space-y-2">
                {colours.map((c, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={c.hex}
                      onChange={(e) => setColours(colours.map((x, j) => (j === i ? { ...x, hex: e.target.value.toUpperCase() } : x)))}
                      className="h-10 w-12 rounded border border-sand-deep"
                      aria-label={`Swatch for ${c.name}`}
                    />
                    <input
                      value={c.name}
                      onChange={(e) => {
                        const old = c.name;
                        const name = e.target.value;
                        setColours(colours.map((x, j) => (j === i ? { ...x, name } : x)));
                        setVariants((vs) => vs.map((v) => (v.colour === old ? { ...v, colour: name } : v)));
                      }}
                      className="h-10 flex-1 rounded-[2px] border border-sand-deep px-3 text-sm"
                      aria-label="Colour name"
                    />
                    <button
                      type="button"
                      onClick={() => setColours(colours.filter((_, j) => j !== i))}
                      disabled={colours.length === 1}
                      className="grid size-10 place-items-center text-bark hover:text-danger disabled:opacity-30"
                      aria-label={`Remove ${c.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setColours([...colours, { name: `Colour ${colours.length + 1}`, hex: "#D9C3A1" }])}
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold underline"
              >
                <Plus className="size-4" /> Add colour
              </button>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Sizes</p>
              <div className="flex flex-wrap items-center gap-2">
                {sizes.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded-full bg-sand px-3 py-1 text-sm">
                    {s}
                    <button type="button" onClick={() => sizes.length > 1 && setSizes(sizes.filter((x) => x !== s))} aria-label={`Remove size ${s}`}>
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
                <input
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  placeholder="Add size"
                  className="h-8 w-24 rounded-[2px] border border-sand-deep px-2 text-sm"
                  aria-label="New size"
                />
                <button
                  type="button"
                  onClick={() => {
                    const s = newSize.trim();
                    if (s && !sizes.includes(s)) setSizes([...sizes, s]);
                    setNewSize("");
                  }}
                  className="text-sm font-semibold underline"
                >
                  Add
                </button>
                <select
                  className="h-8 rounded-[2px] border border-sand-deep px-2 text-sm"
                  value=""
                  onChange={(e) => e.target.value && setSizes(SIZE_PRESETS[e.target.value])}
                  aria-label="Size preset"
                >
                  <option value="">Preset…</option>
                  {Object.keys(SIZE_PRESETS).map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="border-b border-sand text-left text-xs uppercase tracking-[0.1em] text-bark">
                    <th className="py-2 pr-2">Variant</th>
                    <th className="py-2 pr-2">SKU</th>
                    <th className="py-2 pr-2">Stock</th>
                    <th className="py-2 pr-2">Price override £</th>
                    <th className="py-2">On sale</th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((v) => (
                    <tr key={key(v.colour, v.size)} className="border-b border-sand/60">
                      <td className="py-1.5 pr-2 font-medium">
                        {v.colour} / {v.size}
                        {!!v.reserved && <span className="block text-xs text-bark">{v.reserved} reserved</span>}
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          value={v.sku}
                          onChange={(e) => updateVariant(v.colour, v.size, { sku: e.target.value })}
                          placeholder="auto"
                          className="h-9 w-40 rounded-[2px] border border-sand-deep px-2 font-mono text-xs"
                          aria-label={`SKU for ${v.colour} ${v.size}`}
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          type="number"
                          min={0}
                          value={v.stock}
                          onChange={(e) => updateVariant(v.colour, v.size, { stock: Number(e.target.value) })}
                          className="h-9 w-20 rounded-[2px] border border-sand-deep px-2"
                          aria-label={`Stock for ${v.colour} ${v.size}`}
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          inputMode="decimal"
                          value={v.price}
                          onChange={(e) => updateVariant(v.colour, v.size, { price: e.target.value })}
                          placeholder="—"
                          className="h-9 w-24 rounded-[2px] border border-sand-deep px-2"
                          aria-label={`Price override for ${v.colour} ${v.size}`}
                        />
                      </td>
                      <td className="py-1.5">
                        <input
                          type="checkbox"
                          checked={v.isActive}
                          onChange={(e) => updateVariant(v.colour, v.size, { isActive: e.target.checked })}
                          className="size-4 accent-terracotta"
                          aria-label={`${v.colour} ${v.size} available to buy`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-bark">
              Stock changes are recorded in the inventory ledger. Stock can&apos;t be reduced below units reserved by open checkouts.
            </p>
          </section>

          <section className={card}>
            <h2 className="font-display text-xl">Search engines</h2>
            <F
              label="SEO title"
              name="seoTitle"
              defaultValue={initial.seoTitle}
              maxLength={70}
              hint="Up to 70 characters. Defaults to the product name."
            />
            <FArea
              label="Meta description"
              name="seoDescription"
              defaultValue={initial.seoDescription}
              rows={2}
              maxLength={170}
              hint="Up to 170 characters. Defaults to the short description."
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className={card}>
            <h2 className="font-display text-xl">Status</h2>
            {initial.isDemo && <p className="rounded-[2px] bg-mustard/15 p-2 text-xs">Demo product — replace with real details or delete.</p>}
            <FSelect
              label="Visibility"
              name="status"
              defaultValue={initial.status}
              options={[
                { value: "DRAFT", label: "Draft (hidden)" },
                { value: "PUBLISHED", label: "Published" },
                { value: "ARCHIVED", label: "Archived (hidden)" },
              ]}
            />
            <F
              type="checkbox"
              label="Labelling & safety checked"
              name="complianceChecked"
              defaultValue={initial.complianceChecked ? "1" : ""}
              hint="Fibre label, care label and any product-safety checks (e.g. children's drawstrings, nickel in jewellery) are confirmed. Required to publish."
            />
            <FieldError name="complianceChecked" />
            <F type="checkbox" label="Featured" name="isFeatured" defaultValue={initial.isFeatured ? "1" : ""} hint="Promoted first in listings." />
            <F
              label="Best-seller pin (1 = top)"
              name="bestsellerRank"
              type="number"
              min={1}
              defaultValue={initial.bestsellerRank}
              hint="Optional — real sales rank first."
            />
            <Submit className="w-full">Save product</Submit>
          </section>

          <section className={card}>
            <h2 className="font-display text-xl">Pricing</h2>
            <F label="Price (£, inc. VAT if registered)" name="pricePence" inputMode="decimal" defaultValue={initial.price} required />
            <F
              label="Was price (£)"
              name="compareAtPricePence"
              inputMode="decimal"
              defaultValue={initial.compareAt}
              hint="Only use a genuine previous selling price (CMA pricing guidance)."
            />
            <FSelect
              label="Tax class"
              name="taxClassId"
              defaultValue={initial.taxClassId}
              options={[{ value: "", label: "Default" }, ...options.taxClasses.map((t) => ({ value: t.id, label: t.name }))]}
            />
            <F
              label="Landed unit cost (£)"
              name="unitCostPence"
              inputMode="decimal"
              defaultValue={initial.unitCost}
              hint="Updated automatically when purchase orders are received."
            />
            <FSelect
              label="Supplier"
              name="supplierId"
              defaultValue={initial.supplierId}
              options={[{ value: "", label: "None" }, ...options.suppliers.map((s) => ({ value: s.id, label: s.name }))]}
            />
          </section>

          <section className={card}>
            <h2 className="font-display text-xl">Collections</h2>
            <ul className="space-y-2">
              {options.collections.map((c) => (
                <li key={c.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="collectionIds"
                      value={c.id}
                      defaultChecked={initial.collectionIds.includes(c.id)}
                      className="size-4 accent-terracotta"
                    />
                    {c.name}
                  </label>
                </li>
              ))}
            </ul>
            <FSelect
              label="Size guide"
              name="sizeGuide"
              defaultValue={initial.sizeGuide}
              options={[
                { value: "", label: "None" },
                { value: "womens-clothing", label: "Women's clothing" },
                { value: "mens-clothing", label: "Men's clothing" },
                { value: "kids-clothing", label: "Kids' clothing" },
                { value: "one-size", label: "One size / accessories" },
              ]}
            />
          </section>

          <section className={card}>
            <h2 className="font-display text-xl">Placeholder artwork</h2>
            <p className="text-xs text-bark">Shown only until you upload photos.</p>
            <FSelect
              label="Illustration"
              name="artKind"
              defaultValue={initial.artKind}
              options={["dress", "top", "shirt", "trousers", "jacket", "knit", "bag", "necklace", "earrings", "scarf", "hat"].map((k) => ({
                value: k,
                label: k,
              }))}
            />
            <F
              label="Tones (comma separated)"
              name="artTones"
              defaultValue={initial.artTones}
              hint="terracotta, olive, sand, chocolate, mustard, cream"
            />
          </section>
        </div>
      </AdminForm>

      {initial.id && <MediaManager productId={initial.id} images={initial.images} colours={colours.map((c) => c.name)} />}

      {initial.id && (
        <section className="rounded-[3px] border border-danger/30 bg-white p-5">
          <h2 className="font-display text-xl">Delete product</h2>
          <p className="mt-1 text-sm text-bark">
            Products with order history are archived instead of deleted, so past orders and invoices stay intact.
          </p>
          <AdminForm
            action={deleteProductAction}
            confirm="Delete this product? This cannot be undone."
            onSuccess={() => router.push("/admin/products")}
            className="mt-3"
          >
            <input type="hidden" name="id" value={initial.id} />
            <Submit variant="danger">Delete product</Submit>
          </AdminForm>
        </section>
      )}
    </div>
  );
}

function MediaManager({ productId, images, colours }: { productId: string; images: ProductFormData["images"]; colours: string[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const edit = (imageId: string, op: string, alt?: string) =>
    start(async () => {
      const fd = new FormData();
      fd.set("imageId", imageId);
      fd.set("op", op);
      if (alt) fd.set("alt", alt);
      const r = await editProductMediaAction(fd);
      if (r.ok) toast.success(r.message);
      else toast.error(r.error);
      router.refresh();
    });
  return (
    <section className={card} aria-busy={pending}>
      <h2 className="font-display text-xl">Photos & video</h2>
      <p className="text-sm text-bark">
        JPEG/PNG/WebP up to 10 MB (resized and converted to WebP, location data removed). MP4/WebM video up to 50 MB. The first image is the main
        photo.
      </p>
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {images.map((img, i) => (
            <li key={img.id} className="space-y-2">
              <div className="aspect-[4/5] overflow-hidden rounded-[2px] bg-sand">
                {img.type === "VIDEO" ? (
                  <video src={img.url} className="h-full w-full object-cover" muted aria-label={img.alt} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded asset
                  <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
                )}
              </div>
              <input
                defaultValue={img.alt}
                onBlur={(e) => e.target.value !== img.alt && edit(img.id, "alt", e.target.value)}
                className="h-8 w-full rounded-[2px] border border-sand-deep px-2 text-xs"
                aria-label="Alt text"
              />
              <div className="flex justify-between">
                <span className="flex gap-1">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => edit(img.id, "up")}
                    className="grid size-7 place-items-center rounded border border-sand-deep disabled:opacity-30"
                    aria-label="Move earlier"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={i === images.length - 1}
                    onClick={() => edit(img.id, "down")}
                    className="grid size-7 place-items-center rounded border border-sand-deep disabled:opacity-30"
                    aria-label="Move later"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                </span>
                <button
                  type="button"
                  onClick={() => confirm("Remove this file?") && edit(img.id, "delete")}
                  className="grid size-7 place-items-center rounded text-danger"
                  aria-label="Remove"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <AdminForm action={uploadProductMediaAction} resetOnSuccess className="flex flex-wrap items-end gap-3 border-t border-sand pt-4">
        <input type="hidden" name="productId" value={productId} />
        <div>
          <label htmlFor="media-files" className="mb-1 block text-sm font-semibold">
            Files
          </label>
          <input
            id="media-files"
            type="file"
            name="files"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
            className="text-sm"
            required
          />
        </div>
        <F
          label="Alt text (describe the photo)"
          name="alt"
          className="min-w-64 flex-1"
          placeholder="e.g. Model wearing the dress in terracotta, front view"
        />
        <FSelect label="Colour" name="colour" options={[{ value: "", label: "Any" }, ...colours.map((c) => ({ value: c, label: c }))]} />
        <Submit variant="dark">Upload</Submit>
      </AdminForm>
    </section>
  );
}
