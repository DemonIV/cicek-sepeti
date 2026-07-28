import { Skeleton, ProductGridSkeleton } from "@/components/ui/Skeleton";

/**
 * Vitrin tarafının genel iskeleti — ana sayfa, sepet, ödeme, hesabım ve
 * sipariş takibi bunu kullanır. Kendi düzeni belirgin olan sayfaların
 * (katalog, ürün detay, kategori, mağaza) kendi `loading.tsx`'i var.
 */
export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 md:py-12">
      <div className="mx-auto max-w-md text-center">
        <Skeleton className="mx-auto h-2.5 w-32" />
        <Skeleton className="mx-auto mt-5 h-10 w-full" />
        <Skeleton className="mx-auto mt-3 h-3 w-3/4" />
      </div>

      <div className="mt-10">
        <ProductGridSkeleton count={5} />
      </div>
    </div>
  );
}
