/**
 * Sepet, çerezde tutulur: sunucu bileşenleri de sunucu eylemleri de aynı
 * kaynağı okur, ayrı bir istemci deposuyla senkron tutma derdi olmaz.
 */

import { cookies } from "next/headers";
import { db } from "./db";
import { cartTotals } from "./pricing";

export const CART_COOKIE = "cicek_demo_cart";

export type CartLine = { productId: string; quantity: number };

export async function readCart(): Promise<CartLine[]> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (line): line is CartLine =>
          typeof line === "object" &&
          line !== null &&
          typeof (line as CartLine).productId === "string" &&
          Number.isFinite((line as CartLine).quantity),
      )
      .map((line) => ({
        productId: line.productId,
        quantity: Math.max(1, Math.min(20, Math.trunc(line.quantity))),
      }));
  } catch {
    return [];
  }
}

/** Yalnızca sunucu eyleminden veya route handler'dan çağrılabilir. */
export async function writeCart(lines: CartLine[]): Promise<void> {
  const store = await cookies();
  if (lines.length === 0) {
    store.delete(CART_COOKIE);
    return;
  }
  store.set(CART_COOKIE, JSON.stringify(lines), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export type CartItemDetail = {
  productId: string;
  quantity: number;
  unitPrice: number;
  name: string;
  slug: string;
  imageUrl: string;
  stock: number;
  sellerId: string;
  storeName: string;
  sellerCity: string;
  sellerSlug: string;
  commissionRate: number;
};

export type CartDetail = {
  items: CartItemDetail[];
  /** Çok satıcılı siparişi görünür kılmak için mağazaya göre gruplanmış hâli. */
  groups: { sellerId: string; storeName: string; city: string; items: CartItemDetail[] }[];
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
};

export async function getCartDetail(): Promise<CartDetail> {
  const lines = await readCart();
  if (lines.length === 0) {
    return { items: [], groups: [], subtotal: 0, shipping: 0, total: 0, itemCount: 0 };
  }

  const products = await db.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) }, isActive: true },
    include: { seller: true },
  });

  const items: CartItemDetail[] = lines
    .map((line) => {
      const product = products.find((p) => p.id === line.productId);
      if (!product) return null;
      return {
        productId: product.id,
        quantity: Math.min(line.quantity, Math.max(product.stock, 1)),
        unitPrice: product.price,
        name: product.name,
        slug: product.slug,
        imageUrl: product.imageUrl,
        stock: product.stock,
        sellerId: product.sellerId,
        storeName: product.seller.storeName,
        sellerCity: product.seller.city,
        sellerSlug: product.seller.slug,
        commissionRate: product.seller.commissionRate,
      } satisfies CartItemDetail;
    })
    .filter((item): item is CartItemDetail => item !== null);

  const groups = items.reduce<CartDetail["groups"]>((acc, item) => {
    const existing = acc.find((g) => g.sellerId === item.sellerId);
    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({
        sellerId: item.sellerId,
        storeName: item.storeName,
        city: item.sellerCity,
        items: [item],
      });
    }
    return acc;
  }, []);

  const totals = cartTotals(items);

  return { items, groups, ...totals };
}

/**
 * Rozetteki adet. Yalnızca hâlâ satışta olan ürünler sayılır: seed yeniden
 * çalıştığında tarayıcıdaki eski çerez, sepet sayfasında boş görünüp rozette
 * hayalet bir sayı bırakmasın.
 */
export async function getCartCount(): Promise<number> {
  const lines = await readCart();
  if (lines.length === 0) return 0;

  const live = await db.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) }, isActive: true },
    select: { id: true },
  });

  return lines
    .filter((line) => live.some((p) => p.id === line.productId))
    .reduce((sum, line) => sum + line.quantity, 0);
}
