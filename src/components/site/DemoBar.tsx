import Link from "next/link";
import { getCurrentUser, getDemoAccounts } from "@/lib/auth";
import type { Role } from "@/lib/enums";
import { RoleSwitcher, type SwitchAccount } from "./RoleSwitcher";

/**
 * Her sayfanın en üstünde duran ince demo şeridi. Rol değiştirici burada
 * yaşar, böylece sunum sırasında hangi ekranda olursanız olun bir tık uzakta.
 *
 * Telefonda yapışkan değildir: orada üstü mağaza başlığı tutar, iki çubuk üst
 * üste binmesin. Masaüstünde sabit kalır.
 */
export async function DemoBar() {
  const [user, accounts] = await Promise.all([
    getCurrentUser(),
    getDemoAccounts(),
  ]);
  if (!user) return null;

  const toAccount = (
    u: (typeof accounts)["SELLER"][number],
  ): SwitchAccount => ({
    id: u.id,
    name: u.name,
    role: u.role as Role,
    detail:
      u.role === "SELLER"
        ? (u.seller?.storeName ?? null)
        : u.role === "ADMIN"
          ? (u.title ?? "Platform yönetimi")
          : u.role === "COURIER"
            ? "Teslimat"
            : u.email,
  });

  const grouped = {
    CUSTOMER: accounts.CUSTOMER.map(toAccount),
    SELLER: accounts.SELLER.map(toAccount),
    COURIER: accounts.COURIER.map(toAccount),
    ADMIN: accounts.ADMIN.map(toAccount),
  } satisfies Record<Role, SwitchAccount[]>;

  return (
    <div
      data-demo-bar
      className="z-50 border-b border-white/10 bg-plum-950 text-white md:sticky md:top-0"
    >
      <div className="mx-auto flex h-12 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="rounded-sm border border-bloom-400/40 bg-bloom-600/20 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.16em] text-bloom-200">
            DEMO
          </span>
          <p className="hidden truncate text-xs text-white/55 sm:block">
            Sunum prototipi — ödeme, kargo ve kimlik doğrulama simüle
            edilmiştir.
          </p>
          <Link
            href="/mobil-onizleme"
            className="whitespace-nowrap text-xs text-white/70 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white hover:decoration-white/60"
          >
            Mobil önizleme
          </Link>
        </div>

        <RoleSwitcher
          current={{
            id: user.id,
            name: user.name,
            role: user.role as Role,
            detail: user.seller?.storeName ?? user.title ?? user.email,
          }}
          accounts={grouped}
        />
      </div>
    </div>
  );
}
