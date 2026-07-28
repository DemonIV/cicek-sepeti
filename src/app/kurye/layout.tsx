import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PanelShell } from "@/components/panel/PanelShell";
import { RoleGate } from "@/components/site/RoleGate";

export default async function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "COURIER") {
    return (
      <RoleGate
        requiredRole="COURIER"
        target="/kurye"
        title="Kurye paneli"
        description="Bu ekran kuryelerin kendilerine atanan teslimatları gördüğü alandır. Kurye hesabına geçip devam edebilirsin."
      />
    );
  }

  const active = await db.delivery.count({
    where: { courierId: user.id, status: { in: ["ATANDI", "YOLDA"] } },
  });

  return (
    <PanelShell
      root="/kurye"
      subtitle="Kurye paneli"
      brand={user.name}
      items={[
        {
          href: "/kurye",
          label: "Teslimatlarım",
          icon: "truck",
          count: active,
        },
        { href: "/kurye/gecmis", label: "Geçmiş", icon: "check" },
      ]}
    >
      {children}
    </PanelShell>
  );
}
