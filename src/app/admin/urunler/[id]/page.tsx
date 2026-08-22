import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { updateProduct, type ProductFormState } from "@/app/actions/admin";
import { PanelHeader } from "@/components/panel/PanelShell";
import { ProductForm } from "@/components/panel/ProductForm";

export const metadata: Metadata = { title: "Ürünü düzenle" };

type Params = Promise<{ id: string }>;

/** `datetime-local` alanı yerel saat bekler: "2026-08-24T09:00". */
function toLocalInput(value: Date | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
  return parts.replace(" ", "T");
}

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;

  const [product, categories, sellers] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { media: { orderBy: { sortOrder: "asc" } } },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.seller.findMany({
      where: { status: "APPROVED" },
      orderBy: { storeName: "asc" },
    }),
  ]);

  if (!product) notFound();

  async function action(state: ProductFormState, data: FormData) {
    "use server";
    return updateProduct(id, state, data);
  }

  // Ana görsel galeride ilk sırada duruyor; formda ayrı alan olduğu için
  // ek görseller listesinden çıkarılır.
  const gallery = product.media
    .filter((item) => item.kind === "IMAGE" && item.url !== product.imageUrl)
    .map((item) => item.url)
    .join("\n");

  return (
    <>
      <PanelHeader title="Ürünü düzenle" description={product.name} />
      <ProductForm
        action={action}
        categories={categories}
        sellers={sellers}
        submitLabel="Değişiklikleri kaydet"
        initial={{
          name: product.name,
          sellerId: product.sellerId,
          categoryId: product.categoryId,
          price: product.price,
          stock: product.stock,
          imageUrl: product.imageUrl,
          description: product.description,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          isWeeklyPick: product.isWeeklyPick,
          discountPrice: product.discountPrice ?? "",
          discountStartsAt: toLocalInput(product.discountStartsAt),
          discountEndsAt: toLocalInput(product.discountEndsAt),
          videoUrl: product.videoUrl ?? "",
          gallery,
        }}
      />
    </>
  );
}
