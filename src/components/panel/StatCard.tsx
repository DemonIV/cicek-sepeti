import { Icon, type IconName } from "@/components/ui/Icon";

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: IconName;
  accent?: boolean;
}) {
  return (
    <div
      className={`card card-pad ${accent ? "border-bloom-200 bg-bloom-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{label}</p>
        <Icon
          name={icon}
          size={16}
          className={accent ? "text-bloom-500" : "text-plum-300"}
        />
      </div>
      {/* Rakam gövde yüzünde: panelde okunurluk süsten önce gelir, didonenin
          ince tırnakları küçük puntoda ve projeksiyonda dağılıyor. */}
      <p
        className={`tabular mt-2.5 text-[1.75rem] font-bold leading-none tracking-[-0.02em] ${
          accent ? "text-bloom-800" : "text-plum-950"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-xs leading-snug text-muted">{hint}</p>}
    </div>
  );
}
