import type { Metadata } from "next";
import { db } from "@/lib/db";
import { SellerApplyForm } from "@/components/site/SellerApplyForm";
import { Icon, type IconName } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Satıcı ol",
  description:
    "Çiçekçi dükkânını platforma taşı: siparişler mahallendeki müşterilerden gelsin, tahsilat ve kurye yönetimi bizde olsun.",
};

/**
 * "Satıcı ol" — vitrindeki başvuru sayfası.
 *
 * Buradan gelen kayıt admin panelindeki **Satıcı başvuruları** ekranına düşer.
 * Böylece demo'daki halka kapanır: başvuru → onay → satıcı paneli → sipariş.
 */
export default async function SellerApplyPage() {
  const [sellerCount, cityCount, orderCount] = await Promise.all([
    db.seller.count({ where: { status: "APPROVED" } }),
    db.neighborhood
      .findMany({ select: { city: true }, distinct: ["city"] })
      .then((rows) => rows.length),
    db.order.count(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-16">
      <p className="eyebrow">Çiçekçilere</p>
      <h1 className="section-title mt-2 max-w-2xl">
        Dükkânın vitrinde, siparişler tezgâhında
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Platforma katıl, siparişler mahallendeki müşterilerden gelsin. Ürün
        bilgisini ve fiyatı operasyon ekibi seninle birlikte düzenler; sen
        hazırlamaya odaklan.
      </p>

      <dl className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat value={String(sellerCount)} label="onaylı çiçekçi" />
        <Stat value={String(cityCount)} label="şehir" />
        <Stat value={String(orderCount)} label="tamamlanan sipariş" />
      </dl>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
        <SellerApplyForm />

        <aside className="space-y-4">
          <div className="card card-pad">
            <h2 className="text-[15px] font-semibold text-plum-950">
              Başvurdan sonra ne oluyor?
            </h2>
            <ol className="mt-3 space-y-3">
              <Step
                index={1}
                title="Operasyon inceler"
                detail="Mağaza künyeni ve hizmet verebileceğin semtleri konuşuruz."
              />
              <Step
                index={2}
                title="Bölgen ve komisyonun tanımlanır"
                detail="Hangi mahallelere gönderim yapacağın ve komisyon oranın belirlenir."
              />
              <Step
                index={3}
                title="Panelin açılır"
                detail="Siparişler teslim tarihine göre düşer; stoğu kapatma, hazırlık fotoğrafı ve fatura yükleme senin elinde."
              />
            </ol>
          </div>

          <div className="card card-pad">
            <h2 className="text-[15px] font-semibold text-plum-950">
              Panelde neler var?
            </h2>
            <ul className="mt-3 space-y-2.5">
              <Bullet icon="orders" text="Günlük sipariş listesi ve durum takibi" />
              <Bullet icon="wallet" text="Komisyon düşülmüş kazanç dökümü" />
              <Bullet icon="file" text="Fatura yükleme ve onay durumu" />
              <Bullet icon="users" text="Müşteri yorumları ve cevap yazma" />
              <Bullet icon="package" text="Yeni ürün başvurusu ve stok kontrolü" />
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3.5">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="tabular block font-display text-[1.7rem] font-semibold leading-none text-plum-950">
          {value}
        </span>
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
          {label}
        </span>
      </dd>
    </div>
  );
}

function Step({
  index,
  title,
  detail,
}: {
  index: number;
  title: string;
  detail: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="tabular mt-0.5 grid size-6 flex-none place-items-center rounded-full bg-plum-100 text-[11px] font-semibold text-plum-800">
        {index}
      </span>
      <span>
        <span className="block text-[13px] font-semibold text-plum-950">
          {title}
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted">
          {detail}
        </span>
      </span>
    </li>
  );
}

function Bullet({ icon, text }: { icon: IconName; text: string }) {
  return (
    <li className="flex items-start gap-2.5 text-[13px] text-plum-900">
      <Icon name={icon} size={16} className="mt-0.5 flex-none text-plum-400" />
      {text}
    </li>
  );
}
