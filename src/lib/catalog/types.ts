/**
 * Storefront catalogue types. These mirror the Prisma schema planned in
 * docs/01-stage-1-research-and-plan.md §5 so that the Stage 4 database layer
 * can replace the demo data source without changing any UI component.
 */
export type Department = "women" | "men" | "kids" | "accessories";

export type ArtworkKind =
  "dress" | "top" | "shirt" | "trousers" | "jacket" | "knit" | "bag" | "necklace" | "earrings" | "scarf" | "hat" | "landscape" | "loom";

export type ArtworkTone = "terracotta" | "olive" | "sand" | "chocolate" | "mustard" | "cream";

/** A product image. `src` is set once the owner uploads photography; until then a branded placeholder renders. */
export interface MediaAsset {
  src?: string;
  alt: string;
  kind: ArtworkKind;
  tone: ArtworkTone;
}

export interface Colour {
  name: string;
  hex: string;
}

export interface Variant {
  id: string;
  sku: string;
  size: string;
  colour: string;
  /** Units available to sell (on hand minus reserved). */
  stock: number;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  department: Department;
  categorySlug: string;
  collectionSlugs: string[];
  pricePence: number;
  compareAtPricePence?: number;
  colours: Colour[];
  sizes: string[];
  variants: Variant[];
  shortDescription: string;
  description: string;
  fibreComposition: string;
  materials: string;
  care: string[];
  countryOfOrigin: string;
  isHandmade: boolean;
  craftStory?: string;
  isFeatured: boolean;
  bestsellerRank?: number;
  /** ISO date — used for "New arrivals" ordering. */
  publishedAt: string;
  /** Real review aggregate only. Never seeded with invented ratings. */
  rating: RatingSummary;
  images: MediaAsset[];
  sizeGuide?: "womens-clothing" | "mens-clothing" | "kids-clothing" | "one-size";
}

export interface Category {
  slug: string;
  name: string;
  department: Department;
  group: string;
  description?: string;
}

export interface Collection {
  slug: string;
  name: string;
  tagline: string;
  image: MediaAsset;
}
