import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { finalPrice } from '@/lib/price';
import { ExploreProduct } from '@/services/explore';

export type CartItem = { product: ExploreProduct; quantity: number };

type CartBusiness = { id: number; name: string };

type CartValue = {
  /** Negocio del carrito (un pedido = un negocio). */
  businessId: number | null;
  businessName: string | null;
  items: CartItem[];
  /** Unidades totales. */
  count: number;
  /** Suma de (precio con descuento × cantidad). */
  subtotal: number;
  quantityOf: (productId: number) => number;
  /** Suma 1 al producto (fija el negocio si el carrito estaba vacío). */
  add: (product: ExploreProduct, business: CartBusiness) => void;
  decrement: (productId: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

/**
 * Carrito del cliente en memoria: UN negocio a la vez (negocio-first). Vive
 * en el árbol para sobrevivir a la navegación negocio → checkout. Al vaciarse
 * (o tras confirmar el pedido) se suelta el negocio para poder comprar en otro.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<CartBusiness | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);

  const add = useCallback((product: ExploreProduct, biz: CartBusiness) => {
    setBusiness(biz);
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const decrement = useCallback((productId: number) => {
    setItems((prev) => {
      const next = prev
        .map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i,
        )
        .filter((i) => i.quantity > 0);
      if (next.length === 0) setBusiness(null);
      return next;
    });
  }, []);

  const remove = useCallback((productId: number) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.product.id !== productId);
      if (next.length === 0) setBusiness(null);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setBusiness(null);
  }, []);

  const value = useMemo<CartValue>(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce(
      (sum, i) =>
        sum + finalPrice(i.product.priceSale, i.product.discount) * i.quantity,
      0,
    );
    return {
      businessId: business?.id ?? null,
      businessName: business?.name ?? null,
      items,
      count,
      subtotal,
      quantityOf: (productId: number) =>
        items.find((i) => i.product.id === productId)?.quantity ?? 0,
      add,
      decrement,
      remove,
      clear,
    };
  }, [business, items, add, decrement, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
