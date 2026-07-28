import { getCurrentUser } from "@/lib/auth";
import { RoleGate } from "@/components/site/RoleGate";
import { AccountTabs } from "@/components/site/AccountTabs";
import { initials } from "@/lib/format";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "CUSTOMER") {
    return (
      <RoleGate
        requiredRole="CUSTOMER"
        target="/hesabim"
        title="Hesabım müşteri rolüne ait"
        description="Sipariş geçmişi ve adresler müşteri hesabında tutulur. Müşteri rolüne geçip devam edebilirsin."
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6">
      <header className="mb-8 flex items-center gap-4">
        <span className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-plum-900 font-display text-lg font-semibold text-white">
          {initials(user.name)}
        </span>
        <div className="min-w-0">
          <h1 className="text-[1.75rem] leading-tight">{user.name}</h1>
          <p className="truncate text-[13px] text-muted">{user.email}</p>
        </div>
      </header>

      <AccountTabs />

      {children}
    </div>
  );
}
