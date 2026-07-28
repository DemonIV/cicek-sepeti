"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLE_HOME, type Role } from "@/lib/enums";

/**
 * Demo rol değiştirici. Gerçek sistemde bunun yerine her rolün kendi giriş
 * ekranı olur; burada tek amaç sunum sırasında rol değiştirmenin bir tık
 * sürmesi.
 */
export async function switchUser(userId: string, target?: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const store = await cookies();
  store.set(SESSION_COOKIE, user.id, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath("/", "layout");
  redirect(target ?? ROLE_HOME[user.role as Role]);
}

/** Form üzerinden rol değiştirme — RoleGate ekranı bunu kullanır. */
export async function switchUserFromForm(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const target = String(formData.get("target") ?? "");
  if (!userId) return;
  await switchUser(userId, target || undefined);
}
