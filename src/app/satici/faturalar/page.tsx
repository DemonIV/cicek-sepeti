import type { Metadata } from "next";
import { getCurrentSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { INVOICE_STATUS_META, type InvoiceStatus } from "@/lib/enums";
import { PanelHeader } from "@/components/panel/PanelShell";
import { InvoiceUpload } from "@/components/panel/InvoiceUpload";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Faturalarım" };

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** "2026-07" → "Temmuz 2026" */
function periodLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

/**
 * Satıcının fatura yönetimi (madde 2).
 *
 * Bayi her dönem için komisyon faturasını buradan yükler; finans ekibi admin
 * panelinden inceleyip onaylar veya reddeder (madde 1).
 */
export default async function SellerInvoicesPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const invoices = await db.invoice.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
  });

  const pending = invoices.filter((i) => i.status === "BEKLIYOR");
  const approvedTotal = invoices
    .filter((i) => i.status === "ONAYLANDI")
    .reduce((sum, i) => sum + i.amount, 0);

  const thisMonth = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "Europe/Istanbul",
  })
    .format(new Date())
    .slice(0, 7);

  return (
    <>
      <PanelHeader
        title="Faturalarım"
        description="Komisyon faturalarını buradan yükle. Finans ekibi inceledikten sonra durumu bu listede görürsün."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div className="space-y-5">
          <InvoiceUpload defaultPeriod={thisMonth} />

          <div className="card card-pad">
            <h2 className="text-[15px] font-semibold">Özet</h2>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted">Yüklenen fatura</dt>
                <dd className="tabular font-semibold">{invoices.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">İnceleme bekleyen</dt>
                <dd className="tabular font-semibold">{pending.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Onaylanan tutar</dt>
                <dd className="tabular font-semibold text-plum-700">
                  {formatPrice(approvedTotal)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <section className="card overflow-hidden">
          <header className="border-b border-line px-4 py-3.5">
            <h2 className="text-[15px] font-semibold">Yüklediğin faturalar</h2>
          </header>

          {invoices.length === 0 ? (
            <div className="p-4">
              <EmptyState
                compact
                title="Henüz fatura yüklemedin"
                description="Soldaki formdan dönem faturanı yükleyebilirsin."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Dönem</th>
                    <th>Fatura no</th>
                    <th>Tutar</th>
                    <th>Dosya</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const meta =
                      INVOICE_STATUS_META[invoice.status as InvoiceStatus] ??
                      INVOICE_STATUS_META.BEKLIYOR;
                    return (
                      <tr key={invoice.id}>
                        <td>
                          <p className="font-medium text-plum-950">
                            {periodLabel(invoice.periodLabel)}
                          </p>
                          <p className="text-[11.5px] text-faint">
                            {formatDate(invoice.createdAt)} tarihinde yüklendi
                          </p>
                        </td>
                        <td className="mono text-[12.5px]">
                          {invoice.invoiceNo}
                        </td>
                        <td className="tabular font-semibold">
                          {formatPrice(invoice.amount)}
                        </td>
                        <td>
                          <span className="flex items-center gap-2 text-[12.5px] text-muted">
                            <Icon name="file" size={15} className="text-plum-400" />
                            <span className="min-w-0">
                              <span className="block max-w-[12rem] truncate">
                                {invoice.fileName}
                              </span>
                              <span className="tabular text-[11px] text-faint">
                                {formatSize(invoice.fileSize)}
                              </span>
                            </span>
                          </span>
                        </td>
                        <td>
                          <Badge tone={meta.tone} dot>
                            {meta.label}
                          </Badge>
                          {invoice.reviewedBy && (
                            <p className="mt-1 text-[11.5px] text-muted">
                              {invoice.reviewedBy}
                            </p>
                          )}
                          {invoice.status === "REDDEDILDI" && invoice.note && (
                            <p className="mt-1 max-w-[14rem] text-[11.5px] leading-snug text-[#9c2f2a]">
                              {invoice.note}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
