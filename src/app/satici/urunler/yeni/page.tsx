import type { Metadata } from "next";
import { db } from "@/lib/db";
import { createProduct } from "@/app/actions/seller";
import { PanelHeader } from "@/components/panel/PanelShell";
import { ProductForm } from "@/components/panel/ProductForm";

export const metadata: Metadata = { title: "Yeni ürün" };

export default async function NewProductPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <PanelHeader
        title="Yeni ürün"
        description="Kaydettiğinde ürün doğrudan vitrine çıkar."
      />
      <ProductForm
        action={createProduct}
        categories={categories}
        submitLabel="Ürünü yayına al"
        initial={{
          name: "",
          categoryId: "",
          price: "",
          stock: "",
          imageUrl: "",
          description: "",
          isActive: true,
          isFeatured: false,
        }}
      />
    </>
  );
}
