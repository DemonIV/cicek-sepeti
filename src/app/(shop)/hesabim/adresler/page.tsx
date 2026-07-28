import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Adreslerim" };

export default async function AddressesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { title: "asc" }],
  });

  if (addresses.length === 0) {
    return (
      <EmptyState
        title="Kayıtlı adresin yok"
        description="Ödeme adımında girdiğin adresi kaydedebilirsin; sonraki siparişlerde tek tıkla seçilir."
        action={{ href: "/urunler", label: "Alışverişe başla" }}
      />
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {addresses.map((address) => (
          <article key={address.id} className="card card-pad">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon name="pin" size={16} className="text-plum-400" />
                <h2 className="text-[14px] font-semibold">{address.title}</h2>
              </div>
              {address.isDefault && <Badge tone="leaf">Varsayılan</Badge>}
            </div>

            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              {address.fullAddress}
            </p>
            <p className="mt-2 text-[13px] font-medium text-plum-900">
              {address.district}, {address.city}
            </p>
          </article>
        ))}
      </div>

      <p className="mt-6 text-[12.5px] leading-relaxed text-faint">
        Demo notu: adres ekleme ve düzenleme ekranları bu prototipe dahil
        edilmedi. Sipariş verirken adresi ödeme adımında serbestçe yazabilirsin.
      </p>
    </>
  );
}
