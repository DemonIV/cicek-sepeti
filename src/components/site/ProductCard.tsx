import Link from "next/link";
import { ProductImage } from "@/components/ui/ProductImage";
import { RatingInline } from "@/components/ui/Rating";
import { formatPrice } from "@/lib/format";
import { priceInfo, type Discountable } from "@/lib/discount";

export type ProductCardData = Discountable & {
  slug: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  isAddOn?: boolean;
  seller: { storeName: string; city: string };
};

/**
 * Izgaradaki kart genişliği: telefonda ~%50, tablette %34–25, masaüstünde
 * %21–17. `sizes` bu merdiveni birebir tarif eder — yanlış olursa tarayıcı ya
 * bulanık (fazla küçük) ya da gereksiz ağır (fazla büyük) dosya indirir.
 */
const CARD_SIZES =
  "(max-width: 640px) 50vw, (max-width: 768px) 34vw, (max-width: 1024px) 25vw, (max-width: 1536px) 21vw, 260px";

/**
 * Ürün kartı. 21 Ağustos 2026'da müşteri isteğiyle tanıdık e-ticaret kalıbına
 * yaklaştırıldı: yuvarlatılmış tam kare fotoğraf, sol üstte indirim rozeti,
 * altta satıcı → ad → puan → fiyat sırası, indirimde üstü çizili liste fiyatı.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardData;
  priority?: boolean;
}) {
  const soldOut = product.stock <= 0;
  const low = !soldOut && product.stock <= 5;
  const price = priceInfo(product);

  return (
    <Link
      href={`/urun/${product.slug}`}
      className="product-card card group flex flex-col overflow-hidden rounded-xl"
    >
      {/* Tam kare görsel: ızgara sık kurulduğunda kartlar aynı yüksekliğe
          oturur, bir ekranda çok daha fazla ürün görünür. */}
      <div className="relative aspect-square bg-plum-100">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          priority={priority}
          sizes={CARD_SIZES}
          className="transition-transform duration-500 group-hover:scale-[1.04]"
        />

        {price.isDiscounted && !soldOut && (
          <span className="tabular absolute left-2 top-2 rounded-full bg-bloom-600 px-2 py-1 text-[11px] font-bold leading-none text-white shadow-sm">
            %{price.percent}
          </span>
        )}

        {product.isAddOn && (
          <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-plum-800 shadow-sm">
            Ek ürün
          </span>
        )}

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-plum-950/45">
            <span className="rounded-sm bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-plum-900">
              Tükendi
            </span>
          </div>
        )}

        {low && (
          <span className="absolute bottom-2 left-2 rounded-full bg-gold-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-gold-700 shadow-sm">
            Son {product.stock} adet
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <p className="truncate font-mono text-[9.5px] uppercase tracking-[0.11em] text-faint">
          {product.seller.storeName} · {product.seller.city}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[12.5px] font-semibold leading-snug text-plum-950 sm:text-[13px]">
          {product.name}
        </h3>

        {/* Puan fiyatın üstünde durur: önce güven, sonra rakam. */}
        <div className="mt-auto pt-2">
          <RatingInline value={product.rating} count={product.reviewCount} />
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="tabular font-display text-[1.1rem] font-semibold leading-none text-bloom-700 sm:text-[1.15rem]">
              {formatPrice(price.price)}
            </span>
            {price.isDiscounted && (
              <span className="tabular text-[12px] leading-none text-faint line-through">
                {formatPrice(price.listPrice)}
              </span>
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}
