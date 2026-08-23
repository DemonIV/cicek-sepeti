"use client";

import { openAreaDialog } from "@/components/site/DeliveryAreaDialog";
import { Icon } from "@/components/ui/Icon";

/**
 * Başlıktaki teslimat bölgesi düğmesi. Adres modalını açar; JavaScript
 * kapalıysa bağlantı `/teslimat-bolgesi` sayfasına düşer.
 */
export function AreaTrigger({ label }: { label: string | null }) {
  return (
    <a
      href="/teslimat-bolgesi"
      onClick={(event) => {
        event.preventDefault();
        openAreaDialog();
      }}
      className="flex flex-1 items-center gap-2 py-2.5 text-[12.5px] font-semibold text-plum-100 transition-colors hover:text-white md:flex-none md:justify-end"
    >
      <Icon name="pin" size={14} className="text-bloom-300" />
      {label ? (
        <>
          <span className="text-plum-300">Teslimat</span>
          <span className="truncate">{label}</span>
        </>
      ) : (
        <span>Nereye göndereceksin?</span>
      )}
      <Icon name="chevron-down" size={13} className="text-plum-400" />
    </a>
  );
}
