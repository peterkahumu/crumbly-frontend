import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import toast from "react-hot-toast";

const CartContext = createContext(null);
const STORAGE_KEY = "crumbly:cart";
const EMPTY_STATE = { bakery: null, items: [] };

/**
 * Module-level store synced with localStorage, read via useSyncExternalStore.
 * This is the idiomatic way to read an external system (localStorage) into
 * React: getServerSnapshot keeps SSR markup consistent, and the real value
 * is picked up on the client's first render — no setState-in-effect needed.
 */
let cartState = EMPTY_STATE;
let hydratedFromStorage = false;
const listeners = new Set();

function loadFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt localStorage
  }
  return EMPTY_STATE;
}

function persist(nextState) {
  cartState = nextState;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch {
    // ignore write failures (e.g. private browsing quota)
  }
  listeners.forEach((listener) => listener());
}

function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  if (!hydratedFromStorage) {
    hydratedFromStorage = true;
    cartState = loadFromStorage();
  }
  return cartState;
}

function getServerSnapshot() {
  return EMPTY_STATE;
}

export function CartProvider({ children }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { bakery, items } = state;

  const addItem = useCallback((bakeryInfo, cake, qty = 1, size = null) => {
    const isNewBakery = !cartState.bakery || cartState.bakery.id !== bakeryInfo.id;
    if (isNewBakery && cartState.bakery) {
      toast(`Started a new cart for ${bakeryInfo.name} (previous cart was cleared).`);
    }

    const base = isNewBakery ? [] : cartState.items;
    const sameSelection = (i) => i.cakeId === cake.id && i.size === size;
    const existing = base.find(sameSelection);
    const nextItems = existing
      ? base.map((i) => (sameSelection(i) ? { ...i, qty: i.qty + qty } : i))
      : [...base, { cakeId: cake.id, name: cake.name, price: cake.discountPrice ?? cake.price, image: cake.images?.[0], qty, size }];

    persist({ bakery: bakeryInfo, items: nextItems });
    toast.success(`${cake.name} added to cart`);
  }, []);

  const updateQty = useCallback((cakeId, size, qty) => {
    const nextItems =
      qty <= 0
        ? cartState.items.filter((i) => !(i.cakeId === cakeId && i.size === size))
        : cartState.items.map((i) => (i.cakeId === cakeId && i.size === size ? { ...i, qty } : i));
    persist({ ...cartState, items: nextItems });
  }, []);

  const removeItem = useCallback((cakeId, size) => {
    persist({ ...cartState, items: cartState.items.filter((i) => !(i.cakeId === cakeId && i.size === size)) });
  }, []);

  const clearCart = useCallback(() => {
    persist(EMPTY_STATE);
  }, []);

  const totalAmount = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items]);
  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

  const value = useMemo(
    () => ({ bakery, items, addItem, updateQty, removeItem, clearCart, totalAmount, totalItems }),
    [bakery, items, addItem, updateQty, removeItem, clearCart, totalAmount, totalItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
