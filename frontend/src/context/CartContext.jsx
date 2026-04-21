import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { cartApi } from '../api/cartApi';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cartData, setCartData] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartData(null);
      return;
    }
    try {
      const data = await cartApi.getMyCart();
      setCartData(data);
    } catch {
      setCartData(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const cart = cartData?.items || [];
  const cartTotal = cartData?.finalTotalAmount || cartData?.itemsTotalAmount || 0;
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const addToCart = async (product, quantity = 1) => {
    try {
      const data = await cartApi.addItem(product.id, quantity);
      setCartData(data);
      openCart();
    } catch (err) {
      console.error('Add to cart failed:', err);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await cartApi.removeItem(itemId);
      await fetchCart();
    } catch (err) {
      console.error('Remove from cart failed:', err);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) {
      return removeFromCart(itemId);
    }
    try {
      const data = await cartApi.updateItem(itemId, quantity);
      setCartData(data);
    } catch (err) {
      console.error('Update quantity failed:', err);
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clearCart();
      setCartData(null);
    } catch (err) {
      console.error('Clear cart failed:', err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartData,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        openCart,
        closeCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
