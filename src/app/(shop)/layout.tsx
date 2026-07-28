import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { MobileTabBar } from "@/components/site/MobileTabBar";
import { getCartCount } from "@/lib/cart";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cartCount = await getCartCount();

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />

      {/* Sekme çubuğu içeriği örtmesin */}
      <div className="h-[4.25rem] md:hidden" />
      <MobileTabBar cartCount={cartCount} />
    </div>
  );
}
