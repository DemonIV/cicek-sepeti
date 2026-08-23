import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getCartDetail } from "@/lib/cart";
import { db } from "@/lib/db";
import { DELIVERY_SLOTS } from "@/lib/enums";
import { getAreaTree, getSelectedArea } from "@/lib/delivery-area";
import { formatPrice } from "@/lib/format";
import { lineTotal } from "@/lib/pricing";
import { CheckoutForm } from "@/components/site/CheckoutForm";
import { ProductImage } from "@/components/ui/ProductImage";
import { RoleGate } from "@/components/site/RoleGate";
import { readDeliveryPreference } from "@/app/actions/delivery";

export const metadata: Metadata = { title: "Teslimat bilgileri" };

const isoDate = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(
    date,
  );

export default async function CheckoutPage() {
  const [user, cart] = await Promise.all([getCurrentUser(), getCartDetail()]);

  if (cart.items.length === 0) redirect("/sepet");
  if (!user) redirect("/");

  if (user.role !== "CUSTOMER") {
    return (
      <RoleGate
        requiredRole="CUSTOMER"
        title="Sipariş vermek için müşteri hesabı gerekli"
        description="Şu an bir müşteri hesabıyla gezmiyorsun. Sağ üstteki menüden ya da aşağıdaki düğmeyle müşteri rolüne geçip ödemeye devam edebilirsin."
      />
    );
  }

  const [addresses, areaTree, selectedArea, deliveryPref] = await Promise.all([
    db.address.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: "desc" },
    }),
    getAreaTree(),
    getSelectedArea(),
    readDeliveryPreference(),
  ]);

  // Varsayılan teslimat günü BUGÜN: aynı gün teslimat platformun ana vaadi ve
  // satıcı paneli "bugün" ile açıldığı için yeni sipariş oraya düşer (madde 3).
  // Müşteri ürün sayfasında gün/saat seçtiyse o seçim buraya taşınır.
  const today = new Date();
  const defaultDate = deliveryPref?.dateIso ?? isoDate(today);
  const defaultSlot = deliveryPref?.slot;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6">
      <header className="mb-8">
        <nav className="mb-3 flex items-center gap-2 text-[12px] text-muted">
          <Link href="/sepet" className="hover:text-plum-800">
            Sepet
          </Link>
          <span aria-hidden>→</span>
          <span className="font-semibold text-plum-900">
            Teslimat bilgileri
          </span>
          <span aria-hidden>→</span>
          <span>Ödeme</span>
        </nav>
        <h1 className="text-[2rem] leading-tight">Teslimat bilgileri</h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <CheckoutForm
          addresses={addresses.map((a) => ({
            id: a.id,
            title: a.title,
            city: a.city,
            district: a.district,
            fullAddress: a.fullAddress,
          }))}
          areaTree={areaTree}
          selectedAreaId={selectedArea?.id ?? null}
          slots={DELIVERY_SLOTS}
          customer={{ name: user.name, phone: user.phone }}
          defaultDate={defaultDate}
          defaultSlot={defaultSlot}
          minDate={isoDate(new Date())}
        />

        <aside className="lg:sticky lg:top-[4.5rem] lg:self-start">
          <div className="card card-pad">
            <h2 className="text-base font-semibold">Siparişin</h2>

            <ul className="mt-4 space-y-3.5">
              {cart.items.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <div className="relative size-16 flex-none overflow-hidden rounded-md bg-plum-50">
                    <ProductImage
                      src={item.imageUrl}
                      alt={item.name}
                      sizes="64px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13px] font-medium leading-snug">
                      {item.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11.5px] text-muted">
                      {item.storeName} · {item.quantity} adet
                    </p>
                  </div>
                  <p className="tabular whitespace-nowrap text-[13px] font-semibold">
                    {formatPrice(lineTotal(item))}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[13.5px]">
              <div className="flex justify-between">
                <dt className="text-muted">Ara toplam</dt>
                <dd className="tabular">{formatPrice(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Teslimat</dt>
                <dd className="tabular">
                  {cart.shipping === 0
                    ? "Ücretsiz"
                    : formatPrice(cart.shipping)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-sm font-semibold">Toplam</span>
              <span className="tabular font-display text-[1.5rem] font-semibold">
                {formatPrice(cart.total)}
              </span>
            </div>

            {cart.groups.length > 1 && (
              <p className="mt-4 rounded-md bg-plum-50 px-3 py-2.5 text-[12px] leading-snug text-plum-800">
                Bu sipariş {cart.groups.length} çiçekçiye bölünecek. Her biri
                kendi kalemini hazırlar, sen tek takip numarasından izlersin.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
