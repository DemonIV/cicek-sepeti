/**
 * Demo kimlik doğrulama.
 *
 * DİKKAT — Bu bir sunum prototipidir. Gerçek sistemde her rol kendi giriş
 * ekranından şifreyle oturum açar; burada oturum, tek bir çerezde tutulan
 * kullanıcı id'sinden ibarettir. Şifre, hash, token, oturum süresi yoktur.
 * Amaç, sunum sırasında roller arasında tek tıkla geçebilmektir.
 */

import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "./db";
import type { Role } from "./enums";

export const SESSION_COOKIE = "cicek_demo_user";

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/**
 * Aktif kullanıcı. Çerez yoksa demo, ilk müşteri hesabıyla başlar —
 * sunumu açan kişi boş bir ekranla karşılaşmasın.
 */
export const getCurrentUser = cache(async () => {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;

  if (id) {
    const user = await db.user.findUnique({
      where: { id },
      include: { seller: true },
    });
    if (user) return user;
  }

  return db.user.findFirst({
    where: { role: "CUSTOMER" },
    include: { seller: true },
    orderBy: { createdAt: "asc" },
  });
});

export async function getCurrentRole(): Promise<Role | null> {
  const user = await getCurrentUser();
  return (user?.role as Role) ?? null;
}

/** Aktif kullanıcı satıcıysa mağaza kaydı. */
export async function getCurrentSeller() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SELLER" || !user.seller) return null;
  return user.seller;
}

/** Rol değiştirici menüsünü dolduran hesaplar. */
export const getDemoAccounts = cache(async () => {
  const users = await db.user.findMany({
    include: { seller: true },
    orderBy: { createdAt: "asc" },
  });

  const approvedSellers = users.filter(
    (u) => u.role === "SELLER" && u.seller?.status === "APPROVED",
  );

  return {
    CUSTOMER: users.filter((u) => u.role === "CUSTOMER").slice(0, 3),
    SELLER: approvedSellers.slice(0, 3),
    COURIER: users.filter((u) => u.role === "COURIER").slice(0, 3),
    // Üç admin de kendi ismiyle girer; kim neyi değiştirmiş denetim izinde
    // görünür (madde 20).
    ADMIN: users.filter((u) => u.role === "ADMIN").slice(0, 3),
  } satisfies Record<Role, unknown[]>;
});

/** Veritabanı seed edilmiş mi? Boşsa ekranlar kırık yerine yönerge gösterir. */
export async function isDatabaseSeeded(): Promise<boolean> {
  const count = await db.user.count();
  return count > 0;
}
