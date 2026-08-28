import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // Load cart from sessionStorage (only once)
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = sessionStorage.getItem('cart');
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  });

  const [showCartPopup, setShowCartPopup] = useState(false);

  // Save cart to sessionStorage on every cartItems change
  useEffect(() => {
    sessionStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    const handlePageHide = (e) => {
      if (!e.persisted) {
        sessionStorage.removeItem('cart');
        setCartItems([]);
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, []);

  // Add product to cart
  const addToCart = (product, showPopup = true) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });

    if (showPopup) {
      setShowCartPopup(true);
    }
  };

  // Remove product or decrease quantity
  const removeFromCart = (productId) => {
    setCartItems((prev) => {
      const item = prev.find((item) => item._id === productId);
      if (item && item.quantity > 1) {
        return prev.map((item) =>
          item._id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return prev.filter((item) => item._id !== productId);
      }
    });
  };

  // Hide cart popup
  const hideCartPopup = () => setShowCartPopup(false);

  // ✅ Clear cart manually (e.g., on Send Enquiry)
  const clearCart = () => {
    setCartItems([]);
    sessionStorage.removeItem('cart');
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        setCartItems,
        showCartPopup,
        hideCartPopup,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
