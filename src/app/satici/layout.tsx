import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PanelShell } from "@/components/panel/PanelShell";
import { RoleGate } from "@/components/site/RoleGate";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "SELLER" || !user.seller) {
    return (
      <RoleGate
        requiredRole="SELLER"
        target="/satici"
        title="Satıcı paneli"
        description="Bu ekran çiçekçilerin kendi ürünlerini ve siparişlerini yönettiği alandır. Satıcı hesabına geçip devam edebilirsin."
      />
    );
  }

  const seller = user.seller;

  if (seller.status !== "APPROVED") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <p className="eyebrow">Başvuru durumu</p>
        <h1 className="mt-2.5 text-[1.75rem] leading-tight">
          {seller.storeName} henüz onaylanmadı
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {seller.status === "PENDING"
            ? "Başvurun operasyon ekibinin onayını bekliyor. Onaylandığında ürünlerin vitrinde yayına alınır ve siparişler bu panele düşmeye başlar."
            : "Başvurun reddedildi. Detay için operasyon ekibiyle iletişime geçebilirsin."}
        </p>
        <p className="mt-6 rounded-md bg-plum-50 px-4 py-3 text-[12.5px] leading-relaxed text-plum-800">
          Demo ipucu: Admin panelindeki <strong>Satıcı başvuruları</strong>{" "}
          ekranından bu mağazayı onaylayıp buraya geri dönebilirsin.
        </p>
      </div>
    );
  }

  const [pendingOrders, lowStock] = await Promise.all([
    db.order.count({
      where: {
        items: { some: { sellerId: seller.id } },
        status: { in: ["ONAYLANDI", "HAZIRLANIYOR"] },
      },
    }),
    db.product.count({ where: { sellerId: seller.id, stock: { lte: 5 } } }),
  ]);

  return (
    <PanelShell
      root="/satici"
      subtitle="Satıcı paneli"
      brand={`${seller.storeName} · ${seller.city}`}
      items={[
        { href: "/satici", label: "Genel bakış", icon: "dashboard" },
        {
          href: "/satici/urunler",
          label: "Ürünlerim",
          icon: "package",
          count: lowStock,
        },
        {
          href: "/satici/siparisler",
          label: "Siparişlerim",
          icon: "orders",
          count: pendingOrders,
        },
        { href: "/satici/kazanc", label: "Kazançlarım", icon: "wallet" },
      ]}
    >
      {children}
    </PanelShell>
  );
}
