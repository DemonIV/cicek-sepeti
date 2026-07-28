"use server";

import { revalidatePath } from "next/cache";
import { readCart, writeCart } from "@/lib/cart";
import { db } from "@/lib/db";

export async function addToCart(productId: string, quantity = 1) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { seller: true },
  });

  if (!product || !product.isActive || product.seller.status !== "APPROVED") {
    return { ok: false as const, message: "Bu ürün şu anda satışta değil." };
  }
  if (product.stock <= 0) {
    return { ok: false as const, message: "Bu ürün tükendi." };
  }

  const cart = await readCart();
  const existing = cart.find((line) => line.productId === productId);
  const desired = (existing?.quantity ?? 0) + quantity;

  if (desired > product.stock) {
    return {
      ok: false as const,
      message: `Stokta ${product.stock} adet kaldı, daha fazlasını ekleyemezsin.`,
    };
  }

  if (existing) {
    existing.quantity = desired;
  } else {
    cart.push({ productId, quantity });
  }

  await writeCart(cart);
  revalidatePath("/", "layout");

  return { ok: true as const, message: `${product.name} sepete eklendi.` };
}

export async function setCartQuantity(productId: string, quantity: number) {
  const cart = await readCart();
  const next =
    quantity <= 0
      ? cart.filter((line) => line.productId !== productId)
      : cart.map((line) =>
          line.productId === productId ? { ...line, quantity } : line,
        );

  await writeCart(next);
  revalidatePath("/", "layout");
}

export async function removeFromCart(productId: string) {
  const cart = await readCart();
  await writeCart(cart.filter((line) => line.productId !== productId));
  revalidatePath("/", "layout");
}

export async function clearCart() {
  await writeCart([]);
  revalidatePath("/", "layout");
}
