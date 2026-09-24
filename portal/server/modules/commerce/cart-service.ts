import { asc, eq, sql } from "drizzle-orm";
import { products, type Product } from "../../../app/lib/data";
import { getDatabase } from "../../platform/database/client";
import {
  anonymousSessions,
  cartItems,
  carts,
  hostedCheckoutSessions,
  orderItems,
  orders,
  paymentAttempts,
  paymentProviderEvents,
} from "../../platform/database/schema";

export type CartItemView = {
  productId: number;
  name: string;
  category: Product["category"];
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type CartView = {
  items: CartItemView[];
  totalQuantity: number;
  total: number;
};

export type CartOwner = { sessionId: string } | { userId: string };

export class UnknownProductError extends Error {
  constructor(productId: number) {
    super(`Product '${productId}' was not found`);
  }
}

function catalogProduct(productId: number): Product {
  const product = products.find((candidate) => candidate.id === productId);
  if (!product) throw new UnknownProductError(productId);
  return product;
}

function ownerCondition(owner: CartOwner) {
  return "sessionId" in owner
    ? eq(carts.sessionId, owner.sessionId)
    : eq(carts.userId, owner.userId);
}

async function getOrCreateCartId(owner: CartOwner): Promise<string> {
  const database = getDatabase();
  const existing = await database
    .select({ id: carts.id })
    .from(carts)
    .where(ownerCondition(owner))
    .get();
  if (existing) return existing.id;

  const id = crypto.randomUUID();
  await database.insert(carts).values({ id, ...owner }).onConflictDoNothing();
  const created = await database
    .select({ id: carts.id })
    .from(carts)
    .where(ownerCondition(owner))
    .get();
  if (!created) throw new Error("The anonymous cart could not be created");
  return created.id;
}

async function projectCart(cartId: string): Promise<CartView> {
  const rows = await getDatabase()
    .select({ productId: cartItems.productId, quantity: cartItems.quantity })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId))
    .orderBy(asc(cartItems.id));

  const items = rows.map(({ productId, quantity }) => {
    const product = catalogProduct(productId);
    return {
      productId,
      name: product.name,
      category: product.category,
      unitPrice: product.price,
      quantity,
      lineTotal: product.price * quantity,
    };
  });

  return {
    items,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
    total: items.reduce((total, item) => total + item.lineTotal, 0),
  };
}

export async function readCart(owner: CartOwner): Promise<CartView> {
  return projectCart(await getOrCreateCartId(owner));
}

export async function addCartItem(
  owner: CartOwner,
  productId: number,
  quantity: number,
): Promise<CartView> {
  catalogProduct(productId);
  const database = getDatabase();
  const cartId = await getOrCreateCartId(owner);
  const now = new Date().toISOString();

  await database
    .insert(cartItems)
    .values({ cartId, productId, quantity, updatedAt: now })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.productId],
      set: {
        quantity: sql`${cartItems.quantity} + ${quantity}`,
        updatedAt: now,
      },
    });
  await database.update(carts).set({ updatedAt: now }).where(eq(carts.id, cartId));
  return projectCart(cartId);
}

export async function setCartItemQuantity(
  owner: CartOwner,
  productId: number,
  quantity: number,
): Promise<CartView> {
  catalogProduct(productId);
  const database = getDatabase();
  const cartId = await getOrCreateCartId(owner);
  const current = await database
    .select({ id: cartItems.id })
    .from(cartItems)
    .where(sql`${cartItems.cartId} = ${cartId} AND ${cartItems.productId} = ${productId}`)
    .get();
  if (!current) throw new UnknownProductError(productId);

  const now = new Date().toISOString();
  await database
    .update(cartItems)
    .set({ quantity, updatedAt: now })
    .where(eq(cartItems.id, current.id));
  await database.update(carts).set({ updatedAt: now }).where(eq(carts.id, cartId));
  return projectCart(cartId);
}

export async function removeCartItem(
  owner: CartOwner,
  productId: number,
): Promise<CartView> {
  const database = getDatabase();
  const cartId = await getOrCreateCartId(owner);
  await database
    .delete(cartItems)
    .where(sql`${cartItems.cartId} = ${cartId} AND ${cartItems.productId} = ${productId}`);
  await database
    .update(carts)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(carts.id, cartId));
  return projectCart(cartId);
}

export async function clearCart(owner: CartOwner): Promise<CartView> {
  const database = getDatabase();
  const cartId = await getOrCreateCartId(owner);
  await database.delete(cartItems).where(eq(cartItems.cartId, cartId));
  await database
    .update(carts)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(carts.id, cartId));
  return projectCart(cartId);
}

export async function mergeAnonymousCartIntoUser(
  sessionId: string,
  userId: string,
): Promise<CartView> {
  const database = getDatabase();
  const anonymousCart = await database
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.sessionId, sessionId))
    .get();
  const userCart = await database
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.userId, userId))
    .get();

  if (!anonymousCart) return readCart({ userId });
  if (!userCart) {
    await database
      .update(carts)
      .set({ sessionId: null, userId, updatedAt: new Date().toISOString() })
      .where(eq(carts.id, anonymousCart.id));
    return projectCart(anonymousCart.id);
  }

  const anonymousItems = await database
    .select({ productId: cartItems.productId, quantity: cartItems.quantity })
    .from(cartItems)
    .where(eq(cartItems.cartId, anonymousCart.id));
  const now = new Date().toISOString();
  for (const item of anonymousItems) {
    await database
      .insert(cartItems)
      .values({ cartId: userCart.id, ...item, updatedAt: now })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.productId],
        set: {
          quantity: sql`${cartItems.quantity} + ${item.quantity}`,
          updatedAt: now,
        },
      });
  }
  await database.delete(carts).where(eq(carts.id, anonymousCart.id));
  await database.update(carts).set({ updatedAt: now }).where(eq(carts.id, userCart.id));
  return projectCart(userCart.id);
}

export async function resetAnonymousCommerce(): Promise<void> {
  const database = getDatabase();
  await database.delete(paymentProviderEvents);
  await database.delete(hostedCheckoutSessions);
  await database.delete(paymentAttempts);
  await database.delete(orderItems);
  await database.delete(orders);
  await database.delete(cartItems);
  await database.delete(carts);
  await database.delete(anonymousSessions);
}
