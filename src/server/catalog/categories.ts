import "server-only";
import { departments } from "@/lib/catalog/categories";
import type { Department } from "@/lib/catalog/types";
import { getCategories } from "./queries";

export function getDepartment(slug: string) {
  return departments.find((d) => d.slug === slug);
}

export async function getCategoriesFor(department: Department) {
  return (await getCategories()).filter((c) => c.department === department);
}

export async function getCategory(department: Department, slug: string) {
  return (await getCategories()).find((c) => c.department === department && c.slug === slug);
}
