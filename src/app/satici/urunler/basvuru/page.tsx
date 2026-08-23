import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { PanelHeader } from "@/components/panel/PanelShell";
import { ProductRequestForm } from "@/components/panel/ProductRequestForm";

export const metadata: Metadata = { title: "Yeni ürün başvurusu" };

/**
 * Bayi kendi mağazasına ürün önerir; ürün operasyon onayından sonra yayına
 * çıkar. Onay akışı `/admin/urunler/basvurular` ekranında.
 */
export default async function SellerProductRequestPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const categories = await db.category.findMany({
    where: { isHidden: false },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <PanelHeader
        title="Yeni ürün başvurusu"
        description="Mağazana eklemek istediğin ürünü tanımla. Operasyon ekibi onayladığında ürün vitrine çıkar."
        actions={
          <Link href="/satici/urunler" className="btn btn-outline btn-sm">
            Ürünlerim
          </Link>
        }
      />
      <ProductRequestForm
        categories={categories}
        storeName={seller.storeName}
        city={seller.city}
      />
    </>
  );
}
