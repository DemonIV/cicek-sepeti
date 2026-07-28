import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PhonePreview } from "@/components/site/PhonePreview";

export const metadata: Metadata = { title: "Mobil önizleme" };

export default async function MobilePreviewPage() {
  const user = await getCurrentUser();

  // Takip ekranını da gösterebilmek için kullanıcının son siparişini bul.
  const lastOrder = user
    ? await db.order.findFirst({
        where: { customerId: user.id },
        orderBy: { createdAt: "desc" },
        select: { orderNo: true },
      })
    : null;

  return (
    <main className="min-h-[calc(100vh-3rem)] bg-plum-950 px-4 py-12 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-[1180px]">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-1.5 text-[13px] text-plum-200/70 transition-colors hover:text-white"
        >
          ← Vitrine dön
        </Link>

        <PhonePreview
          trackingPath={lastOrder ? `/siparis/${lastOrder.orderNo}` : undefined}
        />
      </div>
    </main>
  );
}
