"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { MediaAsset } from "@/lib/catalog/types";

/**
 * Client-side cart & wishlist state.
 *
 * Stage 2/3: persisted to localStorage so the UI is fully interactive.
 * Stage 4: becomes a thin cache over the server cart (`Cart`/`CartItem` tables),
 * which re-prices every line and validates stock. Prices held here are for
 * DISPLAY ONLY and are never trusted at checkout.
 */
export interface CartLine {
  variantId: string;
  productSlug: string;
  name: string;
  size: string;
  colour: string;
  unitPricePence: number;
  compareAtPence?: number;
  image: MediaAsset;
  quantity: number;
  /** Stock known when the item was added; re-checked on the server at checkout. */
  maxQuantity: number;
}

interface StoreState {
  lines: CartLine[];
  itemCount: number;
  subtotalPence: number;
  ready: boolean;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (line: Omit<CartLine, "quantity">, quantity: number, opts?: { openDrawer?: boolean }) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  clearCart: () => void;
  wishlist: string[];
  toggleWishlist: (slug: string, name: string) => void;
  isWishlisted: (slug: string) => boolean;
}

const StoreContext = createContext<StoreState | null>(null);
const CART_KEY = "wm.cart.v1";
const WISH_KEY = "wm.wishlist.v1";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — cart still works for this session */
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    // Hydrate from storage after mount to avoid server/client markup mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from browser storage
    setLines(readJson<CartLine[]>(CART_KEY, []));
    setWishlist(readJson<string[]>(WISH_KEY, []));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) writeJson(CART_KEY, lines);
  }, [lines, ready]);
  useEffect(() => {
    if (ready) writeJson(WISH_KEY, wishlist);
  }, [wishlist, ready]);

  const addToCart = useCallback<StoreState["addToCart"]>(
    (line, quantity, opts) => {
      const existing = lines.find((l) => l.variantId === line.variantId);
      const current = existing?.quantity ?? 0;
      const next = Math.min(line.maxQuantity, current + quantity);
      if (next === current) {
        toast.warning(`You already have all ${line.maxQuantity} available in your bag.`);
        return;
      }
      setLines(
        existing
          ? lines.map((l) => (l.variantId === line.variantId ? { ...l, ...line, quantity: next } : l))
          : [...lines, { ...line, quantity: next }],
      );
      if (next < current + quantity) toast.warning(`Only ${line.maxQuantity} available — we've added the maximum.`);
      else toast.success(`Added to your bag`, { description: `${line.name} · ${line.colour} · ${line.size}` });
      if (opts?.openDrawer !== false) setCartOpen(true);
    },
    [lines],
  );

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((prev) => prev.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.max(1, Math.min(l.maxQuantity, quantity)) } : l)));
  }, []);

  const removeLine = useCallback((variantId: string) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  }, []);

  const toggleWishlist = useCallback(
    (slug: string, name: string) => {
      const has = wishlist.includes(slug);
      setWishlist(has ? wishlist.filter((s) => s !== slug) : [...wishlist, slug]);
      toast(has ? `Removed from wishlist` : `Saved to wishlist`, { description: name });
    },
    [wishlist],
  );

  const value = useMemo<StoreState>(
    () => ({
      lines,
      itemCount: lines.reduce((n, l) => n + l.quantity, 0),
      subtotalPence: lines.reduce((n, l) => n + l.quantity * l.unitPricePence, 0),
      ready,
      cartOpen,
      setCartOpen,
      addToCart,
      updateQuantity,
      removeLine,
      clearCart: () => setLines([]),
      wishlist,
      toggleWishlist,
      isWishlisted: (slug) => wishlist.includes(slug),
    }),
    [lines, ready, cartOpen, addToCart, updateQuantity, removeLine, wishlist, toggleWishlist],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
