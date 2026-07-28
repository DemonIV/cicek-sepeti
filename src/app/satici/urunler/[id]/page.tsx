import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProduct, type ProductFormState } from "@/app/actions/seller";
import { PanelHeader } from "@/components/panel/PanelShell";
import { ProductForm } from "@/components/panel/ProductForm";

export const metadata: Metadata = { title: "Ürünü düzenle" };

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!product || product.sellerId !== seller.id) notFound();

  async function action(state: ProductFormState, data: FormData) {
    "use server";
    return updateProduct(id, state, data);
  }

  return (
    <>
      <PanelHeader title="Ürünü düzenle" description={product.name} />
      <ProductForm
        action={action}
        categories={categories}
        submitLabel="Değişiklikleri kaydet"
        initial={{
          name: product.name,
          categoryId: product.categoryId,
          price: product.price,
          stock: product.stock,
          imageUrl: product.imageUrl,
          description: product.description,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
        }}
      />
    </>
  );
}
