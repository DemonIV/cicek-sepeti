import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { MobileTabBar } from "@/components/site/MobileTabBar";
import { DeliveryAreaDialog } from "@/components/site/DeliveryAreaDialog";
import { DeliveryBand } from "@/components/site/DeliveryBand";
import { getCartCount } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import {
  areaFullLabel,
  getSelectedArea,
  savedAddressesForArea,
  shouldAskForArea,
} from "@/lib/delivery-area";
import { sameDayWindow } from "@/lib/delivery-time";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cartCount, user, area, askForArea] = await Promise.all([
    getCartCount(),
    getCurrentUser(),
    getSelectedArea(),
    shouldAskForArea(),
  ]);

  // Adres seçimi modalı (23 Ağustos isteği): vitrine girişte bir kez sorulur,
  // sonra başlıktaki bölge düğmesinden açılır. Kayıtlı adresler yalnızca
  // müşteri rolünde dolu gelir — satıcı/kurye/admin vitrini gezerken boş kalır.
  const savedAddresses = user ? await savedAddressesForArea(user.id) : [];

  // Sepette ürün varken navbar'ın altında adres + geri sayım bandı çıkar.
  // Adres satırı önce seçili mahalledeki kayıtlı adresi gösterir (sokak dahil);
  // yoksa mahallenin tam adına düşer.
  const bandAddress = area
    ? (savedAddresses.find((row) => row.neighborhoodId === area.id)
        ?.fullAddress ?? areaFullLabel(area))
    : null;
  const sameDay = sameDayWindow(new Date());

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <SiteHeader />

      {cartCount > 0 && (
        <DeliveryBand
          addressLine={bandAddress}
          areaChosen={Boolean(area)}
          minutesLeft={sameDay.minutesLeft}
          totalMinutes={sameDay.totalMinutes}
        />
      )}

      <div className="flex-1">{children}</div>
      <SiteFooter />

      {/* Sekme çubuğu içeriği örtmesin */}
      <div className="h-[4.25rem] md:hidden" />
      <MobileTabBar cartCount={cartCount} />

      <DeliveryAreaDialog
        initialOpen={askForArea}
        savedAddresses={savedAddresses}
        selectedId={area?.id ?? null}
      />
    </div>
  );
}
