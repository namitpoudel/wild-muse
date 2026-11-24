import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { AdminHeader, AdminSkeleton } from "@/components/admin/ui";
import { EMPTY_PRODUCT, getProductFormOptions } from "@/server/admin/products";
import { requirePermission } from "@/server/auth/session";

export const metadata = { title: "Add product" };

export default function NewProductPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <NewProduct />
    </Suspense>
  );
}

async function NewProduct() {
  await requirePermission("products.write", "/admin/products/new");
  const options = await getProductFormOptions();
  return (
    <div>
      <AdminHeader
        title="Add product"
        back={{ href: "/admin/products", label: "Products" }}
        description="Save as a draft first — you can add photos after the first save."
      />
      <ProductForm initial={EMPTY_PRODUCT} options={options} />
    </div>
  );
}
