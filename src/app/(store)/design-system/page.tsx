import type { Metadata } from "next";
import { PackageOpen } from "lucide-react";
import { Artwork } from "@/components/brand/artwork";
import { LogoMark } from "@/components/brand/logo";
import { ProductCard } from "@/components/product/product-card";
import { ReviewCard } from "@/components/product/review-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, TextField } from "@/components/ui/field";
import { Price } from "@/components/ui/price";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { FeedbackDemo } from "@/components/ui/toast-demo";
import { getProducts } from "@/server/catalog/queries";
import type { ArtworkKind, ArtworkTone } from "@/lib/catalog/types";

export const metadata: Metadata = { title: "Design system", robots: { index: false } };

const palette = [
  { name: "Linen", token: "linen", hex: "#FBF7F0", use: "Page background (natural off-white)", dark: false },
  { name: "Cream", token: "cream", hex: "#F5EDE0", use: "Section backgrounds", dark: false },
  { name: "Sand", token: "sand", hex: "#E9DBC4", use: "Cards, chips, dividers", dark: false },
  { name: "Sand deep", token: "sand-deep", hex: "#D9C3A1", use: "Borders, input outlines", dark: false },
  { name: "Terracotta", token: "terracotta", hex: "#A84A2A", use: "Primary buttons, links, sale — 5.35:1 on linen", dark: true },
  { name: "Burnt orange", token: "burnt", hex: "#C2602A", use: "Accent graphics only (3.9:1 — not for body text)", dark: true },
  { name: "Olive", token: "olive", hex: "#5B6738", use: "Secondary actions, in-stock, trust — 5.71:1", dark: true },
  { name: "Mustard", token: "mustard", hex: "#C99A2E", use: "Stars, highlights on dark — never text on light", dark: false },
  { name: "Chocolate", token: "chocolate", hex: "#3A2417", use: "Body text (13.6:1), dark sections, footer", dark: true },
  { name: "Bark", token: "bark", hex: "#6B5444", use: "Secondary text — 6.61:1 on linen", dark: true },
];

const artworks: [ArtworkKind, ArtworkTone][] = [
  ["dress", "terracotta"],
  ["trousers", "mustard"],
  ["knit", "olive"],
  ["jacket", "chocolate"],
  ["bag", "sand"],
  ["necklace", "cream"],
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-sand py-12">
      <h2 className="eyebrow mb-6 text-terracotta">{title}</h2>
      {children}
    </section>
  );
}

export default async function DesignSystemPage() {
  const [sample] = await getProducts({ limit: 1 });
  return (
    <div className="container-page py-12">
      <p className="eyebrow text-bark">Stage 2</p>
      <h1 className="mt-2 font-display text-display-lg font-light">Wild Muse design system</h1>
      <p className="mt-3 max-w-2xl text-bark">
        The tokens and components every page is built from. Colour pairs are verified against WCAG 2.2 AA by <code>npm run check:contrast</code>.
      </p>

      <Section title="Brand">
        <div className="flex flex-wrap items-center gap-10">
          <div className="flex items-center gap-3">
            <LogoMark className="size-14" />
            <span className="font-display text-4xl tracking-[0.22em]">WILD MUSE</span>
          </div>
          <p className="font-display text-2xl italic">&ldquo;Find Your Wild. Wear Your Soul.&rdquo;</p>
        </div>
        <p className="mt-6 text-sm text-bark">
          Alternative slogans for consideration: &ldquo;Woven by Hand. Worn by Free Spirits.&rdquo; · &ldquo;From the Himalaya to Your Heart.&rdquo; ·
          &ldquo;Handmade Soul for Wild Hearts.&rdquo;
        </p>
      </Section>

      <Section title="Colour">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {palette.map((c) => (
            <li key={c.token} className="overflow-hidden rounded-[3px] border border-sand">
              <div className="flex h-24 items-end p-3" style={{ backgroundColor: c.hex, color: c.dark ? "#FBF7F0" : "#3A2417" }}>
                <span className="text-xs font-bold">{c.hex}</span>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="font-mono text-[0.7rem] text-bark">{c.token}</p>
                <p className="mt-1 text-xs text-bark">{c.use}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Typography">
        <div className="space-y-5">
          <p className="font-display text-display-xl font-light uppercase">Display XL</p>
          <p className="font-display text-display-lg font-light">Display Large — Fraunces Light</p>
          <p className="font-display text-display-md">Display Medium — section headings</p>
          <p className="eyebrow text-terracotta">Eyebrow label — Manrope 600, tracked</p>
          <p className="max-w-2xl text-lg leading-relaxed">
            Body large — Manrope. Hand-loomed in Palpa, cut and sewn in a small Kathmandu workshop, and shipped across the UK.
          </p>
          <p className="max-w-2xl text-sm text-bark">Body small / secondary — used for helper text, captions and metadata.</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="dark">Dark</Button>
          <Button variant="olive">Olive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Text link</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Badges & prices">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="sale">Sale −20%</Badge>
          <Badge tone="new">New</Badge>
          <Badge tone="handmade">Handmade</Badge>
          <Badge tone="success">In stock</Badge>
          <Badge tone="warning">2 left</Badge>
          <Badge tone="danger">Sold out</Badge>
          <Price pricePence={8900} />
          <Price pricePence={3800} compareAtPence={4500} />
        </div>
      </Section>

      <Section title="Forms">
        <div className="grid max-w-3xl gap-5 md:grid-cols-2">
          <TextField label="Email" type="email" placeholder="name@example.com" hint="We'll send your order confirmation here." />
          <TextField label="Postcode" defaultValue="SW1A 1A" error="Enter a valid UK postcode, like SW1A 1AA" />
          <TextField label="Address line 2" optional />
          <Checkbox label="Email me about new collections" description="Optional. Unsubscribe at any time." />
        </div>
      </Section>

      <Section title="Feedback">
        <FeedbackDemo />
      </Section>

      <Section title="Product card, loading & empty states">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {sample && <ProductCard product={sample} />}
          <ProductCardSkeleton />
          <div className="col-span-2 rounded-[3px] border border-sand">
            <EmptyState icon={PackageOpen} title="Nothing here yet" action={<Button size="sm">Call to action</Button>}>
              Empty states always explain what will appear and offer a next step.
            </EmptyState>
          </div>
        </div>
      </Section>

      <Section title="Review card (design sample — not a real review)">
        <div className="max-w-md">
          <ReviewCard
            review={{
              id: "sample",
              rating: 5,
              title: "Sample review title",
              body: "This is placeholder copy used only to design the review card. Real reviews come only from customers.",
              authorName: "Sample customer",
              verifiedPurchase: true,
              dateLabel: "Design sample",
              variantLabel: "Terracotta / 10",
            }}
            reportable
          />
        </div>
      </Section>

      <Section title="Placeholder artwork (replaced by uploaded photography)">
        <ul className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {artworks.map(([k, t]) => (
            <li key={k} className="aspect-[4/5] overflow-hidden rounded-[2px]">
              <Artwork kind={k} tone={t} label={`${k} illustration on ${t}`} />
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
