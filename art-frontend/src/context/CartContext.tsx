import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface CartItem {
  _id: string;
  title: string;
  price: number;
  image: string;
  artistName?: string;
  artistId?: string;
  size?: string;
  variantId?: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: any, variant?: any) => void;
  removeFromCart: (id: string, variantId?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  toggleCart: () => void;
  updateQuantity: (
    id: string,
    variantId: string | undefined,
    delta: number,
  ) => void;
  isCartOpen: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);

  // 1. Load cart when User changes
  useEffect(() => {
    const cartKey = user ? `cart_${user._id}` : "cart_guest";
    const saved = localStorage.getItem(cartKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCart(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setCart([]);
      }
    } else {
      setCart([]);
    }
  }, [user]);

  const [isCartOpen, setIsCartOpen] = useState(false);

  // 2. Save cart when Cart changes
  useEffect(() => {
    // Guard against initial empty overwrite if user is loading?
    // Logic: if we want to save, we just save.
    // But we need to know the *current* user to save to.
    const cartKey = user ? `cart_${user._id}` : "cart_guest";
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, user]);

  const addToCart = (art: any, variant?: any) => {
    // Enforce only one product in cart: Replace entire cart with the new item
    const price = variant ? parseFloat(variant.price) : art.price;
    const size = variant ? variant.size : art.variants?.[0]?.size || "Standard";
    const variantId = variant ? `${art._id || art.id}-${variant.size}` : (art._id || art.id);

    const newItem: CartItem = {
      _id: art._id || art.id,
      title: art.title,
      price: price,
      image: art.images?.[0] || "",
      artistName: art.artistBrandName || art.artistName,
      artistId: art.artistId,
      size: size,
      variantId: variantId,
      quantity: 1, // Always 1
    };

    setCart((prev) => {
      const existing = prev.find(item => item.variantId === variantId);
      if (existing) {
        return prev.map(item => item.variantId === variantId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, newItem];
    });
    setIsCartOpen(true); // Auto open cart on add
  };

  const removeFromCart = (id: string, variantId?: string) => {
    setCart((prev) =>
      prev.filter((item) => {
        if (variantId) return item.variantId !== variantId;
        return item._id !== id;
      }),
    );
  };

  const updateQuantity = (
    id: string,
    variantId: string | undefined,
    delta: number,
  ) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item._id === id && (!variantId || item.variantId === variantId)) {
            return { ...item, quantity: Math.max(0, item.quantity + delta) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const clearCart = () => setCart([]);

  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        toggleCart,
        isCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
