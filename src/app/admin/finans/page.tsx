import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDate, formatDateShort, formatPrice } from "@/lib/format";
import { summarizeEarnings } from "@/lib/pricing";
import { REVENUE_FILTER, ABANDONED_FILTER } from "@/lib/orders";
import { INVOICE_STATUS_META, type InvoiceStatus } from "@/lib/enums";
import { PanelHeader } from "@/components/panel/PanelShell";
import { StatCard } from "@/components/panel/StatCard";
import {
  InvoiceReview,
  PaymentReminderButton,
} from "@/components/panel/SellerControls";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Finans ve raporlar" };

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function periodLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

const dayKey = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(date);

/**
 * Finans ve raporlar (madde 1).
 *
 * Üç iş bir arada: platformun para tablosu, bayi hakedişleri ve bayilerin
 * yüklediği faturaların incelenmesi (madde 2'nin karşılığı). Ödemesi yarım
 * kalan siparişlere hatırlatma da buradan gider (madde 14).
 */
export default async function AdminFinancePage() {
  const [paidItems, sellers, invoices, abandoned, revenueOrders] =
    await Promise.all([
      db.orderItem.findMany({
        where: { status: { not: "IPTAL" }, order: REVENUE_FILTER },
        select: { unitPrice: true, quantity: true, commissionRate: true },
      }),
      db.seller.findMany({
        where: { status: "APPROVED" },
        include: {
          items: {
            where: { status: { not: "IPTAL" }, order: REVENUE_FILTER },
            select: { unitPrice: true, quantity: true, commissionRate: true },
          },
          invoices: true,
        },
        orderBy: { storeName: "asc" },
      }),
      db.invoice.findMany({
        include: { seller: true },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 40,
      }),
      db.order.findMany({
        where: ABANDONED_FILTER,
        include: { customer: true, items: true },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      db.order.findMany({
        where: REVENUE_FILTER,
        select: { createdAt: true, total: true },
      }),
    ]);

  const totals = summarizeEarnings(paidItems);

  // Son altı hafta — dönem raporu. Ay yerine hafta: platform 30 günlük veriyle
  // çalışıyor, aylık kırılımda sütunların çoğu boş kalıyordu.
  const weeks: {
    startKey: string;
    endKey: string;
    label: string;
    revenue: number;
    count: number;
  }[] = [];

  for (let i = 5; i >= 0; i--) {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    weeks.push({
      startKey: dayKey(start),
      endKey: dayKey(end),
      label:
        i === 0
          ? "Bu hafta"
          : `${formatDateShort(start).slice(0, 5)} – ${formatDateShort(end).slice(0, 5)}`,
      revenue: 0,
      count: 0,
    });
  }

  for (const order of revenueOrders) {
    const key = dayKey(order.createdAt);
    const bucket = weeks.find((w) => key >= w.startKey && key <= w.endKey);
    if (bucket) {
      bucket.revenue += order.total;
      bucket.count += 1;
    }
  }
  const maxRevenue = Math.max(1, ...weeks.map((w) => w.revenue));

  const pendingInvoices = invoices.filter((i) => i.status === "BEKLIYOR");
  const abandonedTotal = abandoned.reduce((sum, order) => sum + order.total, 0);

  return (
    <>
      <PanelHeader
        title="Finans ve raporlar"
        description="Platform geliri, bayi hakedişleri, fatura yüklemeleri ve yarım kalan ödemeler tek ekranda."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Toplam ciro"
          value={formatPrice(totals.gross)}
          icon="chart"
          hint="Ödemesi alınmış, iptal edilmemiş siparişler"
        />
        <StatCard
          label="Platform komisyonu"
          value={formatPrice(totals.commission)}
          icon="wallet"
          hint="Kalem bazlı, sipariş anındaki oranla"
        />
        <StatCard
          label="Bayi hakedişi"
          value={formatPrice(totals.net)}
          icon="store"
          hint="Komisyon düşülmüş tutar"
        />
        <StatCard
          label="Bekleyen fatura"
          value={String(pendingInvoices.length)}
          icon="file"
          accent={pendingInvoices.length > 0}
          hint="İnceleme bekleyen bayi faturası"
        />
      </div>

      {/* ------------------------------ Dönem raporu ------------------------ */}
      <section className="card mt-8 overflow-hidden">
        <header className="border-b border-line px-4 py-3.5">
          <h2 className="text-[15px] font-semibold">Haftalık ciro</h2>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Son altı hafta — ödemesi alınmış siparişler.
          </p>
        </header>

        <div className="grid gap-px bg-[var(--color-line)] sm:grid-cols-3 lg:grid-cols-6">
          {weeks.map((week) => (
            <div key={week.startKey} className="bg-surface p-4">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">
                {week.label}
              </p>
              <p className="tabular mt-2 text-[15px] font-semibold text-plum-950">
                {formatPrice(week.revenue)}
              </p>
              <p className="tabular text-[11.5px] text-faint">
                {week.count} sipariş
              </p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-plum-100">
                <div
                  className="h-full rounded-full bg-plum-600"
                  style={{
                    width: `${Math.max(3, Math.round((week.revenue / maxRevenue) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------- Bayi hakedişleri ----------------------- */}
      <section className="card mt-8 overflow-hidden">
        <header className="border-b border-line px-4 py-3.5">
          <h2 className="text-[15px] font-semibold">Bayi hakedişleri</h2>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Her bayinin cirosu, kesilen komisyon ve fatura durumu.
          </p>
        </header>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bayi</th>
                <th>Ciro</th>
                <th>Komisyon</th>
                <th>Hakediş</th>
                <th>Fatura</th>
                <th className="text-right">Künye</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller) => {
                const own = summarizeEarnings(seller.items);
                const waiting = seller.invoices.filter(
                  (i) => i.status === "BEKLIYOR",
                ).length;
                const approved = seller.invoices.filter(
                  (i) => i.status === "ONAYLANDI",
                ).length;

                return (
                  <tr key={seller.id}>
                    <td>
                      <p className="font-medium text-plum-950">
                        {seller.storeName}
                      </p>
                      <p className="text-[11.5px] text-muted">{seller.city}</p>
                    </td>
                    <td className="tabular font-semibold">
                      {formatPrice(own.gross)}
                    </td>
                    <td className="tabular text-bloom-700">
                      {formatPrice(own.commission)}
                    </td>
                    <td className="tabular font-semibold text-plum-700">
                      {formatPrice(own.net)}
                    </td>
                    <td>
                      {seller.invoices.length === 0 ? (
                        <span className="text-[12px] text-faint">
                          Fatura yok
                        </span>
                      ) : (
                        <span className="text-[12px] text-muted">
                          {approved} onaylı
                          {waiting > 0 && (
                            <span className="ml-1 font-semibold text-gold-700">
                              · {waiting} bekliyor
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <Link
                          href={`/admin/saticilar/${seller.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          Aç
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------------------- Fatura yüklemeleri -------------------- */}
      <section className="card mt-8 overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5">
          <div>
            <h2 className="text-[15px] font-semibold">Fatura yüklemeleri</h2>
            <p className="mt-0.5 text-[12.5px] text-muted">
              Bayiler kendi panelinden yükler; buradan onaylanır ya da geri
              gönderilir.
            </p>
          </div>
          {pendingInvoices.length > 0 && (
            <Badge tone="amber" dot>
              {pendingInvoices.length} fatura inceleme bekliyor
            </Badge>
          )}
        </header>

        {invoices.length === 0 ? (
          <div className="p-4">
            <EmptyState
              compact
              title="Henüz fatura yüklenmedi"
              description="Bayiler fatura yükledikçe burada listelenir."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bayi</th>
                  <th>Dönem</th>
                  <th>Fatura no</th>
                  <th>Tutar</th>
                  <th>Dosya</th>
                  <th>Durum</th>
                  <th className="text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const meta =
                    INVOICE_STATUS_META[invoice.status as InvoiceStatus] ??
                    INVOICE_STATUS_META.BEKLIYOR;

                  return (
                    <tr key={invoice.id}>
                      <td className="font-medium">
                        {invoice.seller.storeName}
                      </td>
                      <td className="whitespace-nowrap text-muted">
                        {periodLabel(invoice.periodLabel)}
                      </td>
                      <td className="mono text-[12.5px]">
                        {invoice.invoiceNo}
                      </td>
                      <td className="tabular font-semibold">
                        {formatPrice(invoice.amount)}
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          {invoice.previewUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={invoice.previewUrl}
                              alt=""
                              className="size-10 flex-none rounded-md border border-line object-cover"
                            />
                          ) : (
                            <span className="grid size-10 flex-none place-items-center rounded-md border border-line bg-plum-50 text-plum-400">
                              <Icon name="file" size={16} />
                            </span>
                          )}
                          <span className="min-w-0">
                            <span className="block max-w-[11rem] truncate text-[12.5px]">
                              {invoice.fileName}
                            </span>
                            <span className="tabular block text-[11px] text-faint">
                              {formatSize(invoice.fileSize)} ·{" "}
                              {formatDateShort(invoice.createdAt)}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <Badge tone={meta.tone} dot>
                          {meta.label}
                        </Badge>
                        {invoice.reviewedBy && (
                          <p className="mt-1 text-[11px] text-muted">
                            {invoice.reviewedBy}
                            {invoice.reviewedAt
                              ? ` · ${formatDateShort(invoice.reviewedAt)}`
                              : ""}
                          </p>
                        )}
                      </td>
                      <td>
                        {invoice.status === "BEKLIYOR" ? (
                          <InvoiceReview invoiceId={invoice.id} />
                        ) : (
                          <p className="text-right text-[12px] text-faint">
                            İncelendi
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

      {/* ------------------------ Yarım kalan ödemeler ---------------------- */}
      <section className="card mt-8 overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5">
          <div>
            <h2 className="text-[15px] font-semibold">Yarım kalan ödemeler</h2>
            <p className="mt-0.5 text-[12.5px] text-muted">
              Müşteri bilgilerini girdi ama ödemeyi tamamlamadı. Hatırlatma
              gönderdiğinde müşteri, takip ekranından ödemeyi tamamlayabilir.
            </p>
          </div>
          {abandoned.length > 0 && (
            <span className="tabular text-[12.5px] font-semibold text-plum-800">
              {formatPrice(abandonedTotal)} kurtarılabilir
            </span>
          )}
        </header>

        {abandoned.length === 0 ? (
          <div className="p-4">
            <EmptyState
              compact
              title="Yarım kalan ödeme yok"
              description="Bütün siparişlerin ödemesi tamamlanmış."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sipariş</th>
                  <th>Müşteri</th>
                  <th>Tutar</th>
                  <th>Oluşturuldu</th>
                  <th>Hatırlatma</th>
                  <th className="text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {abandoned.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/admin/siparisler/${order.orderNo}`}
                        className="mono whitespace-nowrap font-semibold text-plum-900 hover:underline"
                      >
                        {order.orderNo}
                      </Link>
                      <p className="text-[11.5px] text-faint">
                        {order.items.length} kalem
                      </p>
                    </td>
                    <td>
                      <p className="font-medium">{order.customer.name}</p>
                      <p className="mono text-[11.5px] text-muted">
                        {order.customer.phone ?? order.customer.email}
                      </p>
                    </td>
                    <td className="tabular font-semibold">
                      {formatPrice(order.total)}
                    </td>
                    <td className="tabular whitespace-nowrap text-muted">
                      {formatDate(order.createdAt)}
                    </td>
                    <td>
                      {order.reminderCount === 0 ? (
                        <span className="text-[12px] text-faint">
                          Gönderilmedi
                        </span>
                      ) : (
                        <span className="text-[12px] text-muted">
                          {order.reminderCount} kez
                          {order.lastReminderAt && (
                            <span className="block text-[11px] text-faint">
                              son: {formatDateShort(order.lastReminderAt)}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <PaymentReminderButton
                          orderId={order.id}
                          reminderCount={order.reminderCount}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
