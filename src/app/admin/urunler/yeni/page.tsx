import type { Metadata } from "next";
import { db } from "@/lib/db";
import { createProduct } from "@/app/actions/admin";
import { PanelHeader } from "@/components/panel/PanelShell";
import { ProductForm } from "@/components/panel/ProductForm";

export const metadata: Metadata = { title: "Yeni ürün" };

export default async function NewProductPage() {
  const [categories, sellers] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.seller.findMany({
      where: { status: "APPROVED" },
      orderBy: { storeName: "asc" },
    }),
  ]);

  return (
    <>
      <PanelHeader
        title="Yeni ürün"
        description="Ürün bilgisini operasyon ekibi yönetir; bayi yalnızca stoğu kapatabilir."
      />
      <ProductForm
        action={createProduct}
        categories={categories}
        sellers={sellers}
        submitLabel="Ürünü yayına al"
        initial={{
          name: "",
          sellerId: "",
          categoryId: "",
          price: "",
          stock: "",
          imageUrl: "",
          description: "",
          isActive: true,
          isFeatured: false,
          isWeeklyPick: false,
          discountPrice: "",
          discountStartsAt: "",
          discountEndsAt: "",
          videoUrl: "",
          gallery: "",
        }}
      />
    </>
  );
}
