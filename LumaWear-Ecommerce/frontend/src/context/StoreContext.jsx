import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { products } from "../data/products";
import { useAuth } from "./AuthContext";

const StoreContext = createContext(null);
const SHIPPING_THRESHOLD = 75;
const STORAGE_KEY = "lumawear-store";

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error("Failed to parse persisted store state", error);
    return fallback;
  }
}

const defaultInitialState = {
  products,
  cart: [],
  wishlist: [],
  recentlyViewed: [],
};

function storeKeyFor(userId) {
  return userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
}

function getInitialStoreState() {
  if (typeof window === "undefined" || !window.localStorage) {
    return defaultInitialState;
  }
  // Guest cart: legacy shared key only (migrated per-user below).
  const persisted = safeParse(localStorage.getItem(STORAGE_KEY), null);
  if (!persisted) {
    return defaultInitialState;
  }
  const rawCart = Array.isArray(persisted.cart) ? persisted.cart : Array.isArray(persisted) ? persisted : [];
  const rawWishlist = Array.isArray(persisted.wishlist) ? persisted.wishlist : [];
  const rawRecentlyViewed = Array.isArray(persisted.recentlyViewed) ? persisted.recentlyViewed : [];
  return {
    products,
    cart: rawCart,
    wishlist: rawWishlist,
    recentlyViewed: rawRecentlyViewed,
  };
}

function readUserStore(userId) {
  if (typeof window === "undefined" || !window.localStorage || !userId) return null;
  const persisted = safeParse(localStorage.getItem(storeKeyFor(userId)), null);
  if (!persisted) return null;
  return {
    products,
    cart: Array.isArray(persisted.cart) ? persisted.cart : [],
    wishlist: Array.isArray(persisted.wishlist) ? persisted.wishlist : [],
    recentlyViewed: Array.isArray(persisted.recentlyViewed) ? persisted.recentlyViewed : [],
  };
}

function storeReducer(state, action) {
  switch (action.type) {
    case "hydrate":
      return {
        ...state,
        cart: Array.isArray(action.payload?.cart)
          ? action.payload.cart
          : Array.isArray(action.payload)
          ? action.payload
          : state.cart,
        wishlist: Array.isArray(action.payload?.wishlist) ? action.payload.wishlist : state.wishlist,
        recentlyViewed: Array.isArray(action.payload?.recentlyViewed)
          ? action.payload.recentlyViewed
          : state.recentlyViewed,
      };
    case "addToCart": {
      const { productId, size = "", color = "", quantity = 1 } = action.payload || {};
      if (!productId) return state;
      const parsedQty = Math.max(1, Number(quantity) || 1);
      const existing = state.cart.find(
        (item) => item.productId === productId && (item.size || "") === (size || "") && (item.color || "") === (color || "")
      );
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.id === existing.id ? { ...item, quantity: item.quantity + parsedQty } : item
          ),
        };
      }
      return {
        ...state,
        cart: [
          ...state.cart,
          {
            id: `${productId}-${size || "default"}-${color || "default"}`,
            productId,
            size: size || "",
            color: color || "",
            quantity: parsedQty,
          },
        ],
      };
    }
    case "updateCartQty": {
      const targetId = action.payload?.id;
      const nextQty = Math.max(1, Number(action.payload?.quantity) || 1);
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.id === targetId ? { ...item, quantity: nextQty } : item
        ),
      };
    }
    case "removeFromCart": {
      const targetId = action.payload?.id;
      return { ...state, cart: state.cart.filter((item) => item.id !== targetId) };
    }
    case "toggleWishlist": {
      const productId = String(action.payload?.productId || action.payload?.id || action.payload || "").trim();
      if (!productId) return state;
      const exists = state.wishlist.includes(productId);
      return {
        ...state,
        wishlist: exists
          ? state.wishlist.filter((id) => id !== productId)
          : [...state.wishlist, productId],
      };
    }
    case "clearCart":
      return { ...state, cart: [] };
    case "addRecentlyViewed": {
      const productId = String(action.payload?.productId || action.payload?.id || action.payload || "").trim();
      if (!productId) return state;
      if (state.recentlyViewed[0] === productId) return state;
      return {
        ...state,
        recentlyViewed: [productId, ...state.recentlyViewed.filter((id) => id !== productId)].slice(0, 8),
      };
    }
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(storeReducer, undefined, getInitialStoreState);
  const { logActivity, user } = useAuth();
  const userId = user?._id || user?.id || null;
  const prevUserIdRef = useRef(userId);

  // Switch persisted carts per account: on login load that user's store,
  // on logout clear to the guest store so the next visitor sees empty badges.
  useEffect(() => {
    const prev = prevUserIdRef.current;
    if (prev === userId) return;
    prevUserIdRef.current = userId;
    if (typeof window === "undefined" || !window.localStorage) return;
    if (userId) {
      const saved = readUserStore(userId);
      dispatch({ type: "hydrate", payload: saved || { cart: [], wishlist: [], recentlyViewed: [] } });
    } else {
      const guest = safeParse(localStorage.getItem(STORAGE_KEY), null);
      dispatch({
        type: "hydrate",
        payload: {
          cart: Array.isArray(guest?.cart) ? guest.cart : [],
          wishlist: Array.isArray(guest?.wishlist) ? guest.wishlist : [],
          recentlyViewed: Array.isArray(guest?.recentlyViewed) ? guest.recentlyViewed : [],
        },
      });
    }
  }, [userId]);

  // Immediate clear on logout event (before user state propagates).
  useEffect(() => {
    const onLogout = () => dispatch({ type: "hydrate", payload: { cart: [], wishlist: [], recentlyViewed: [] } });
    if (typeof window !== "undefined") window.addEventListener("lumawear:logout", onLogout);
    return () => {
      if (typeof window !== "undefined") window.removeEventListener("lumawear:logout", onLogout);
    };
  }, []);

  const trackRef = useRef(null);
  trackRef.current = (type, metadata) => {
    void logActivity({
      type,
      route: typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "",
      metadata,
    });
  };
  const track = (type, metadata) => trackRef.current?.(type, metadata);

  useEffect(() => {
    try {
      const key = storeKeyFor(userId);
      localStorage.setItem(
        key,
        JSON.stringify({
          cart: state.cart,
          wishlist: state.wishlist,
          recentlyViewed: state.recentlyViewed,
        })
      );
      // Keep a clean guest store: never leak a logged-in user's cart into it.
      // On logout the badges hydrate from this guest key (empty).
      if (!userId) return;
    } catch (err) {
      console.error("Failed to persist store state to localStorage", err);
    }
  }, [state.cart, state.wishlist, state.recentlyViewed, userId]);

  const derived = useMemo(() => {
    const cartItems = state.cart
      .map((item) => {
        const product = state.products.find((p) => p.id === item.productId);
        if (!product) {
          return null;
        }
        const activePrice = product.salePrice || product.price;
        return { ...item, product, lineTotal: activePrice * item.quantity };
      })
      .filter(Boolean);
    const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const shipping = subtotal >= SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 8;
    const discount = subtotal > 250 ? Math.round(subtotal * 0.08) : 0;
    const total = subtotal + shipping - discount;
    return { cartItems, subtotal, shipping, discount, total };
  }, [state.cart, state.products]);

  const addToCart = (payload) => {
    track("cart_add", payload);
    dispatch({ type: "addToCart", payload });
  };

  const updateCartQty = (payload) => {
    track("cart_update", payload);
    dispatch({ type: "updateCartQty", payload });
  };

  const removeFromCart = (payload) => {
    track("cart_remove", payload);
    dispatch({ type: "removeFromCart", payload });
  };

  const toggleWishlist = (payload) => {
    track("wishlist_toggle", payload);
    dispatch({ type: "toggleWishlist", payload });
  };

  const clearCart = () => {
    track("cart_clear", { itemCount: state.cart.length });
    dispatch({ type: "clearCart" });
  };

  const addRecentlyViewed = (payload) => {
    track("product_viewed", payload);
    dispatch({ type: "addRecentlyViewed", payload });
  };

  // Global store handles cart, wishlist, and recently viewed product state.
  const value = useMemo(
    () => ({
      ...state,
      ...derived,
      shippingThreshold: SHIPPING_THRESHOLD,
      addToCart,
      updateCartQty,
      removeFromCart,
      toggleWishlist,
      clearCart,
      addRecentlyViewed,
    }),
    [state, derived]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return ctx;
}

