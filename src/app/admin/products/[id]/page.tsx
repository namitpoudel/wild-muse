import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { AdminHeader, AdminSkeleton } from "@/components/admin/ui";
import { getProductForEdit, getProductFormOptions } from "@/server/admin/products";
import { requirePermission } from "@/server/auth/session";

export const metadata = { title: "Edit product" };

export default function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Edit params={params} />
    </Suspense>
  );
}

async function Edit({ params }: Pick<PageProps<"/admin/products/[id]">, "params">) {
  await requirePermission("products.write", "/admin/products");
  const { id } = await params;
  const [product, options] = await Promise.all([getProductForEdit(id.slice(0, 40)), getProductFormOptions()]);
  if (!product) notFound();
  return (
    <div>
      <AdminHeader
        title={product.name}
        back={{ href: "/admin/products", label: "Products" }}
        actions={
          product.status === "PUBLISHED" && (
            <Link href={`/products/${product.slug}`} target="_blank" className="text-sm font-semibold underline">
              View on site ↗
            </Link>
          )
        }
      />
      <ProductForm initial={product} options={options} />
    </div>
  );
}
