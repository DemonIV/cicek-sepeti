import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PanelShell } from "@/components/panel/PanelShell";
import { RoleGate } from "@/components/site/RoleGate";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    return (
      <RoleGate
        requiredRole="ADMIN"
        target="/admin"
        title="Admin paneli"
        description="Bu ekran platformu yöneten operasyon ekibine aittir: satıcı onayları, komisyon oranları, tüm siparişler ve kurye atamaları."
      />
    );
  }

  const [applications, unassigned, pendingInvoices, productRequests, lowReviews] =
    await Promise.all([
      db.seller.count({ where: { status: "PENDING" } }),
      db.order.count({
        where: {
          status: { in: ["ONAYLANDI", "HAZIRLANIYOR"] },
          delivery: { courierId: null },
        },
      }),
      db.invoice.count({ where: { status: "BEKLIYOR" } }),
      db.productRequest.count({ where: { status: "BEKLIYOR" } }),
      db.review.count({ where: { rating: { lte: 2 }, isHidden: false } }),
    ]);

  return (
    <PanelShell
      root="/admin"
      subtitle="Admin paneli"
      brand={`${user.name} · Operasyon`}
      items={[
        { href: "/admin", label: "Genel bakış", icon: "dashboard" },
        {
          href: "/admin/basvurular",
          label: "Satıcı başvuruları",
          icon: "users",
          count: applications,
        },
        { href: "/admin/saticilar", label: "Satıcı yönetimi", icon: "store" },
        {
          href: "/admin/siparisler",
          label: "Tüm siparişler",
          icon: "orders",
          count: unassigned,
        },
        {
          href: "/admin/urunler",
          label: "Ürün yönetimi",
          icon: "package",
          count: productRequests,
        },
        {
          href: "/admin/yorumlar",
          label: "Yorum yönetimi",
          icon: "users",
          count: lowReviews,
        },
        {
          href: "/admin/finans",
          label: "Finans ve raporlar",
          icon: "wallet",
          count: pendingInvoices,
        },
        { href: "/admin/kayitlar", label: "İşlem kayıtları", icon: "shield" },
      ]}
    >
      {children}
    </PanelShell>
  );
}
