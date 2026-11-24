import type { Category, Department } from "./types";

/**
 * Departments are fixed; the category tree below is the SEED source only —
 * the live tree comes from the Category table (editable in Admin → Categories).
 */
type Def = [slug: string, name: string, group: string];

const tree: Record<Department, Def[]> = {
  women: [
    ["dresses", "Dresses", "Dresses"],
    ["bohemian-dresses", "Bohemian Dresses", "Dresses"],
    ["maxi-dresses", "Maxi Dresses", "Dresses"],
    ["co-ord-sets", "Co-ord Sets", "Dresses"],
    ["jumpsuits", "Jumpsuits", "Dresses"],
    ["tops", "Tops", "Tops & Layers"],
    ["shirts", "Shirts", "Tops & Layers"],
    ["blouses", "Blouses", "Tops & Layers"],
    ["jackets", "Jackets", "Tops & Layers"],
    ["hoodies", "Hoodies", "Tops & Layers"],
    ["knitwear", "Knitwear", "Tops & Layers"],
    ["cardigans", "Cardigans", "Tops & Layers"],
    ["trousers", "Trousers", "Bottoms"],
    ["harem-pants", "Harem Pants", "Bottoms"],
    ["palazzo-pants", "Palazzo Pants", "Bottoms"],
    ["skirts", "Skirts", "Bottoms"],
    ["festival-wear", "Festival Wear", "Edits"],
    ["handmade-clothing", "Handmade Clothing", "Edits"],
  ],
  men: [
    ["shirts", "Shirts", "Clothing"],
    ["t-shirts", "T-Shirts", "Clothing"],
    ["hoodies", "Hoodies", "Clothing"],
    ["jackets", "Jackets", "Clothing"],
    ["waistcoats", "Waistcoats", "Clothing"],
    ["knitwear", "Knitwear", "Clothing"],
    ["cardigans", "Cardigans", "Clothing"],
    ["harem-trousers", "Harem Trousers", "Trousers"],
    ["casual-trousers", "Casual Trousers", "Trousers"],
    ["festival-clothing", "Festival Clothing", "Edits"],
    ["bohemian-accessories", "Bohemian Accessories", "Edits"],
  ],
  kids: [
    ["girls-clothing", "Girls' Clothing", "Shop by"],
    ["boys-clothing", "Boys' Clothing", "Shop by"],
    ["tops", "Kids' Tops", "Clothing"],
    ["trousers", "Trousers", "Clothing"],
    ["dresses", "Dresses", "Clothing"],
    ["hoodies", "Hoodies", "Clothing"],
    ["jackets", "Jackets", "Clothing"],
    ["accessories", "Accessories", "Clothing"],
  ],
  accessories: [
    ["necklaces", "Handmade Necklaces", "Jewellery"],
    ["bracelets", "Bracelets", "Jewellery"],
    ["rings", "Rings", "Jewellery"],
    ["earrings", "Earrings", "Jewellery"],
    ["beaded-jewellery", "Beaded Jewellery", "Jewellery"],
    ["silver-jewellery", "Silver Jewellery", "Jewellery"],
    ["wooden-jewellery", "Wooden Jewellery", "Jewellery"],
    ["bags", "Handmade Bags", "Bags"],
    ["crossbody-bags", "Crossbody Bags", "Bags"],
    ["backpacks", "Backpacks", "Bags"],
    ["scarves", "Scarves", "Accessories"],
    ["hats", "Hats", "Accessories"],
    ["belts", "Belts", "Accessories"],
    ["hair-accessories", "Hair Accessories", "Accessories"],
  ],
};

export const departments: { slug: Department; name: string; tagline: string }[] = [
  { slug: "women", name: "Women", tagline: "Flowing, hand-finished pieces for free spirits." },
  { slug: "men", name: "Men", tagline: "Easy-wearing shirts, knits and harem trousers." },
  { slug: "kids", name: "Kids", tagline: "Soft cotton and wool for little wanderers." },
  { slug: "accessories", name: "Jewellery & Accessories", tagline: "Beads, silver, wool and hemp — made by hand." },
];

export const categories: Category[] = (Object.keys(tree) as Department[]).flatMap((department) =>
  tree[department].map(([slug, name, group]) => ({ slug, name, group, department })),
);

export function getDepartment(slug: string) {
  return departments.find((d) => d.slug === slug);
}

/** Group a department's categories into mega-menu columns (pure — pass the live category list). */
export function groupCategories(list: Category[], department: Department) {
  const groups = new Map<string, Category[]>();
  for (const c of list.filter((x) => x.department === department)) {
    groups.set(c.group, [...(groups.get(c.group) ?? []), c]);
  }
  return [...groups.entries()].map(([name, items]) => ({ name, items }));
}
