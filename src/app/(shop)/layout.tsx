import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { MobileTabBar } from "@/components/site/MobileTabBar";
import { DeliveryAreaDialog } from "@/components/site/DeliveryAreaDialog";
import { getCartCount } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import {
  getSelectedArea,
  savedAddressesForArea,
  shouldAskForArea,
} from "@/lib/delivery-area";

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

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <SiteHeader />
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
