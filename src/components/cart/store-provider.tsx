"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { addToCartAction, getCartAction, updateCartLineAction } from "@/app/actions/cart";
import { getWishlistAction, mergeWishlistAction, toggleWishlistAction } from "@/app/actions/wishlist";
import type { CartLineView, CartView } from "@/server/cart/cart";

/**
 * Client state for the bag and wishlist. The SERVER is the source of truth:
 * every change goes through a server action that re-reads prices and stock, and the
 * returned cart replaces local state. Quantity changes are applied optimistically.
 * Guests' wishlists live in this browser until they sign in, then merge into the account.
 */
export type CartLine = CartLineView;

interface StoreState {
  lines: CartLine[];
  itemCount: number;
  subtotalPence: number;
  couponCode: string | null;
  ready: boolean;
  signedIn: boolean;
  userName: string | null;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (variantId: string, quantity: number, meta: { name: string; label: string }, opts?: { openDrawer?: boolean }) => Promise<boolean>;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  setCart: (cart: CartView) => void;
  refresh: () => Promise<void>;
  wishlist: string[];
  toggleWishlist: (slug: string, name: string) => void;
  isWishlisted: (slug: string) => boolean;
}

const StoreContext = createContext<StoreState | null>(null);
const WISH_KEY = "wm.wishlist.v1";
const EMPTY: CartView = { lines: [], itemCount: 0, subtotalPence: 0, couponCode: null };

function readLocalWishlist(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(WISH_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function writeLocalWishlist(v: string[]) {
  try {
    localStorage.setItem(WISH_KEY, JSON.stringify(v));
  } catch {}
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartView>(EMPTY);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const pending = useRef<Record<string, number>>({});

  const refresh = useCallback(async () => {
    try {
      const [c, w] = await Promise.all([getCartAction(), getWishlistAction()]);
      setCart(c);
      setSignedIn(w.signedIn);
      setUserName(w.name);
      if (w.signedIn) {
        const local = readLocalWishlist();
        if (local.length) {
          setWishlist(await mergeWishlistAction(local));
          writeLocalWishlist([]);
        } else setWishlist(w.slugs);
      } else setWishlist(readLocalWishlist());
    } catch (e) {
      console.error("Could not load bag", e);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load of server-held bag/wishlist
    void refresh();
  }, [refresh]);

  const addToCart = useCallback<StoreState["addToCart"]>(async (variantId, quantity, meta, opts) => {
    const res = await addToCartAction({ variantId, quantity });
    if (!res.ok) {
      toast.error(res.error);
      return false;
    }
    setCart(res.data.cart);
    if (res.data.capped) toast.warning("We've added the maximum available.");
    else toast.success("Added to your bag", { description: `${meta.name} · ${meta.label}` });
    if (opts?.openDrawer !== false) setCartOpen(true);
    return true;
  }, []);

  const sendQuantity = useCallback(async (variantId: string, quantity: number) => {
    const id = (pending.current[variantId] ?? 0) + 1;
    pending.current[variantId] = id;
    const res = await updateCartLineAction({ variantId, quantity });
    if (pending.current[variantId] !== id) return; // a newer change superseded this one
    if (res.ok) setCart(res.data);
    else {
      toast.error(res.error);
      setCart(await getCartAction());
    }
  }, []);

  const updateQuantity = useCallback(
    (variantId: string, quantity: number) => {
      setCart((c) => {
        const lines = c.lines.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.max(1, Math.min(l.maxQuantity || 1, quantity)) } : l));
        return {
          ...c,
          lines,
          itemCount: lines.reduce((n, l) => n + l.quantity, 0),
          subtotalPence: lines.filter((l) => !l.issue).reduce((n, l) => n + l.quantity * l.unitPricePence, 0),
        };
      });
      void sendQuantity(variantId, quantity);
    },
    [sendQuantity],
  );

  const removeLine = useCallback(
    (variantId: string) => {
      setCart((c) => {
        const lines = c.lines.filter((l) => l.variantId !== variantId);
        return {
          ...c,
          lines,
          itemCount: lines.reduce((n, l) => n + l.quantity, 0),
          subtotalPence: lines.filter((l) => !l.issue).reduce((n, l) => n + l.quantity * l.unitPricePence, 0),
        };
      });
      void sendQuantity(variantId, 0);
    },
    [sendQuantity],
  );

  const toggleWishlist = useCallback(
    (slug: string, name: string) => {
      const has = wishlist.includes(slug);
      const next = has ? wishlist.filter((s) => s !== slug) : [slug, ...wishlist];
      setWishlist(next);
      toast(has ? "Removed from wishlist" : "Saved to wishlist", { description: name });
      if (signedIn) {
        void toggleWishlistAction(slug).then((r) => r.ok && setWishlist(r.slugs));
      } else writeLocalWishlist(next);
    },
    [wishlist, signedIn],
  );

  const value = useMemo<StoreState>(
    () => ({
      lines: cart.lines,
      itemCount: cart.itemCount,
      subtotalPence: cart.subtotalPence,
      couponCode: cart.couponCode,
      ready,
      signedIn,
      userName,
      cartOpen,
      setCartOpen,
      addToCart,
      updateQuantity,
      removeLine,
      setCart,
      refresh,
      wishlist,
      toggleWishlist,
      isWishlisted: (slug) => wishlist.includes(slug),
    }),
    [cart, ready, signedIn, userName, cartOpen, addToCart, updateQuantity, removeLine, refresh, wishlist, toggleWishlist],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
