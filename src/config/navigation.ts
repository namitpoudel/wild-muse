/**
 * Main navigation. Department menus are generated from the category tree; the
 * Stage 4 admin edits this via NavigationMenu/NavigationItem tables.
 */
import { groupCategories } from "@/lib/catalog/categories";
import type { ArtworkKind, ArtworkTone, Category, Department } from "@/lib/catalog/types";

export interface NavLink {
  label: string;
  href: string;
}
export interface NavGroup {
  name: string;
  links: NavLink[];
}
export interface NavItem {
  label: string;
  href: string;
  groups?: NavGroup[];
  feature?: { title: string; href: string; kind: ArtworkKind; tone: ArtworkTone; caption: string };
  highlight?: boolean;
}

function deptMenu(categories: Category[], dept: Department, label: string, feature: NavItem["feature"]): NavItem {
  return {
    label,
    href: `/${dept}`,
    groups: groupCategories(categories, dept).map((g) => ({
      name: g.name,
      links: g.items.map((c) => ({ label: c.name, href: `/${dept}/${c.slug}` })),
    })),
    feature,
  };
}

/** Main navigation, built from the live category tree. */
export const buildMainNav = (categories: Category[]): NavItem[] => [
  { label: "New Arrivals", href: "/new-arrivals" },
  deptMenu(categories, "women", "Women", {
    title: "The Bohemian Edit",
    href: "/collections/the-bohemian-edit",
    kind: "dress",
    tone: "terracotta",
    caption: "Dhaka trims, tiered maxis and hand embroidery",
  }),
  deptMenu(categories, "men", "Men", {
    title: "Himalayan Knits",
    href: "/collections/himalayan-heritage",
    kind: "knit",
    tone: "olive",
    caption: "Hand-knitted wool for colder days",
  }),
  deptMenu(categories, "kids", "Kids", {
    title: "Little Wanderers",
    href: "/kids",
    kind: "hat",
    tone: "mustard",
    caption: "Soft cotton and felted wool",
  }),
  deptMenu(categories, "accessories", "Jewellery & Accessories", {
    title: "Handmade Treasures",
    href: "/collections/handmade-treasures",
    kind: "necklace",
    tone: "chocolate",
    caption: "Hand-strung beads and hammered silver",
  }),
  {
    label: "Handmade in Nepal",
    href: "/handmade-in-nepal",
    groups: [
      {
        name: "Our Story",
        links: [
          { label: "Our Nepal Story", href: "/handmade-in-nepal/our-nepal-story" },
          { label: "Meet the Artisans", href: "/handmade-in-nepal/meet-the-artisans" },
          { label: "Behind the Scenes", href: "/handmade-in-nepal/behind-the-scenes" },
        ],
      },
      {
        name: "Craft & Materials",
        links: [
          { label: "Traditional Craftsmanship", href: "/handmade-in-nepal/traditional-craftsmanship" },
          { label: "Our Materials", href: "/handmade-in-nepal/our-materials" },
          { label: "Ethical Sourcing", href: "/handmade-in-nepal/ethical-sourcing" },
          { label: "Handmade Collections", href: "/handmade-in-nepal/handmade-collections" },
        ],
      },
    ],
    feature: {
      title: "From the loom",
      href: "/handmade-in-nepal/traditional-craftsmanship",
      kind: "loom",
      tone: "sand",
      caption: "How Dhaka cloth is woven in Palpa",
    },
  },
  { label: "Collections", href: "/collections" },
  { label: "Sale", href: "/sale", highlight: true },
];

export const footerNav: NavGroup[] = [
  {
    name: "Help",
    links: [
      { label: "Contact Us", href: "/pages/contact" },
      { label: "FAQs", href: "/pages/faqs" },
      { label: "Delivery Information", href: "/pages/delivery" },
      { label: "Returns & Refunds", href: "/pages/returns" },
      { label: "Size Guide", href: "/pages/size-guide" },
      { label: "Track My Order", href: "/track-order" },
    ],
  },
  {
    name: "Wild Muse",
    links: [
      { label: "About Wild Muse", href: "/pages/about" },
      { label: "Handmade in Nepal", href: "/handmade-in-nepal" },
      { label: "Wholesale Enquiries", href: "/pages/wholesale" },
      { label: "Review Policy", href: "/pages/review-policy" },
    ],
  },
  {
    name: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/pages/terms" },
      { label: "Privacy Policy", href: "/pages/privacy" },
      { label: "Cookie Policy", href: "/pages/cookies" },
    ],
  },
];
