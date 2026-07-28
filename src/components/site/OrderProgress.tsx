import {
  ORDER_FLOW,
  ORDER_STATUS_META,
  statusRank,
  type OrderStatus,
} from "@/lib/order-status";
import { Icon } from "@/components/ui/Icon";

export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "IPTAL") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-line bg-plum-50 px-4 py-4">
        <Icon name="alert" size={18} className="mt-0.5 text-muted" />
        <div>
          <p className="text-sm font-semibold text-plum-950">
            Sipariş iptal edildi
          </p>
          <p className="mt-1 text-[13px] text-muted">
            Ödeme alındıysa 3 iş günü içinde kartına iade edilir.
          </p>
        </div>
      </div>
    );
  }

  const current = statusRank(status);

  return (
    <ol className="grid gap-0 sm:grid-cols-5">
      {ORDER_FLOW.map((step, index) => {
        const done = index <= current;
        const active = index === current;

        return (
          <li key={step} className="relative flex gap-3 pb-6 sm:block sm:pb-0">
            {/* Bağlantı çizgisi */}
            <span
              aria-hidden
              className={`absolute left-[0.6875rem] top-6 h-[calc(100%-1.5rem)] w-0.5 sm:left-0 sm:top-[0.6875rem] sm:h-0.5 sm:w-full ${
                index === ORDER_FLOW.length - 1 ? "hidden" : ""
              } ${index < current ? "bg-plum-600" : "bg-line"}`}
            />

            <span
              className={`relative z-10 flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 ${
                done
                  ? "border-plum-600 bg-plum-600 text-white"
                  : "border-line-strong bg-surface text-transparent"
              } ${active ? "ring-4 ring-plum-100" : ""}`}
            >
              <Icon name="check" size={12} />
            </span>

            <div className="sm:mt-3 sm:pr-4">
              <p
                className={`text-[13px] font-semibold leading-tight ${
                  done ? "text-plum-950" : "text-faint"
                }`}
              >
                {ORDER_STATUS_META[step].label}
              </p>
              {active && (
                <p className="mt-1 text-[12px] leading-snug text-muted">
                  {ORDER_STATUS_META[step].customerLine}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
