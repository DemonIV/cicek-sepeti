import Link from "next/link";
import { switchUserFromForm } from "@/app/actions/session";
import { getCurrentUser, getDemoAccounts } from "@/lib/auth";
import { ROLE_LABEL, type Role } from "@/lib/enums";
import { Icon } from "@/components/ui/Icon";

/**
 * Yanlış rolle bir panele girildiğinde gösterilir. Sunumda kimse "yetkiniz
 * yok" duvarına toslamasın diye doğru role geçiren düğmeyi de sunar.
 */
export async function RoleGate({
  requiredRole,
  title,
  description,
  target,
}: {
  requiredRole: Role;
  title: string;
  description: string;
  target?: string;
}) {
  const [user, accounts] = await Promise.all([
    getCurrentUser(),
    getDemoAccounts(),
  ]);
  const candidate = accounts[requiredRole][0];

  return (
    <div className="mx-auto flex max-w-lg flex-col items-start px-4 py-20 sm:px-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-md bg-bloom-50 text-bloom-600">
        <Icon name="alert" size={20} />
      </span>

      <p className="eyebrow mt-5">
        Şu anki rol: {user ? ROLE_LABEL[user.role as Role] : "—"}
      </p>
      <h1 className="mt-2.5 text-[1.75rem] leading-tight">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        {candidate && (
          <form action={switchUserFromForm}>
            <input type="hidden" name="userId" value={candidate.id} />
            {target && <input type="hidden" name="target" value={target} />}
            <button type="submit" className="btn btn-primary">
              {ROLE_LABEL[requiredRole]} olarak devam et
              <Icon name="arrow-right" size={16} />
            </button>
          </form>
        )}
        <Link href="/" className="btn btn-outline">
          Ana sayfaya dön
        </Link>
      </div>

      <p className="mt-6 text-[12px] leading-relaxed text-faint">
        Gerçek sistemde bu ekran giriş sayfasına yönlendirir. Demo'da rol geçişi
        tek tık olsun diye böyle bırakıldı.
      </p>
    </div>
  );
}
