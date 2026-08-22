import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDateTime, initials } from "@/lib/format";
import { AUDIT_ACTION_LABEL, type AuditAction } from "@/lib/audit";
import { PanelHeader } from "@/components/panel/PanelShell";
import { FilterChip } from "@/components/panel/FilterChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "İşlem kayıtları" };

type Search = Promise<{ kisi?: string }>;

/**
 * Denetim izi (madde 20).
 *
 * Üç kişi aynı admin paneline kendi ismiyle giriyor; komisyonu kimin
 * düşürdüğü, bölgeyi kimin açtığı, faturayı kimin onayladığı burada tek tek
 * duruyor. Kayıtlar silinemez, yalnızca okunur.
 */
export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { kisi } = await searchParams;

  const [admins, logs] = await Promise.all([
    db.user.findMany({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } }),
    db.auditLog.findMany({
      where: kisi ? { userId: kisi } : {},
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
  ]);

  const counts = new Map<string, number>();
  for (const log of logs) {
    if (log.userId) counts.set(log.userId, (counts.get(log.userId) ?? 0) + 1);
  }

  return (
    <>
      <PanelHeader
        title="İşlem kayıtları"
        description="Admin panelinde yapılan her değişiklik kim yaptıysa onun adıyla kaydedilir. Kayıtlar düzenlenemez."
      />

      <nav className="scroll-row mb-5">
        <FilterChip href="/admin/kayitlar" label="Herkes" active={!kisi} />
        {admins.map((admin) => (
          <FilterChip
            key={admin.id}
            href={`/admin/kayitlar?kisi=${admin.id}`}
            label={admin.name}
            active={kisi === admin.id}
          />
        ))}
      </nav>

      {/* Kim ne kadar işlem yapmış — üç kişilik ekipte bu tek bakışta anlaşılsın */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {admins.map((admin) => (
          <div key={admin.id} className="card flex items-center gap-3 p-4">
            <span className="grid size-10 flex-none place-items-center rounded-full bg-plum-900 font-mono text-[12px] font-bold text-white">
              {initials(admin.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-plum-950">
                {admin.name}
              </p>
              <p className="truncate text-[12px] text-muted">
                {admin.title ?? "Operasyon"} ·{" "}
                <span className="tabular">{counts.get(admin.id) ?? 0}</span>{" "}
                işlem
              </p>
            </div>
          </div>
        ))}
      </div>

      {logs.length === 0 ? (
        <EmptyState
          title="Kayıt yok"
          description="Bu filtrede işlem kaydı bulunmuyor."
          action={{ href: "/admin/kayitlar", label: "Tüm kayıtlar" }}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Zaman</th>
                  <th>Kim</th>
                  <th>İşlem</th>
                  <th>Özet</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="tabular whitespace-nowrap text-muted">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="whitespace-nowrap font-medium">
                      <span className="flex items-center gap-2">
                        <Icon name="shield" size={14} className="text-plum-400" />
                        {log.actorName}
                      </span>
                    </td>
                    <td>
                      <span className="rounded-sm bg-plum-50 px-2 py-1 text-[11.5px] font-semibold text-plum-800">
                        {AUDIT_ACTION_LABEL[log.action as AuditAction] ??
                          log.action}
                      </span>
                    </td>
                    <td className="text-plum-900">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
