import React, { createContext, useContext, useState, useEffect } from 'react';
import { Course } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface CartContextType {
  cartCourses: Course[];
  cartCount: number;
  subtotal: number;
  savings: number;
  loading: boolean;
  addToCart: (courseId: string) => Promise<void>;
  removeFromCart: (courseId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isInCart: (courseId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [cartCourses, setCartCourses] = useState<Course[]>([]);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [savings, setSavings] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshCart = async () => {
    if (!user) {
      setCartCourses([]);
      setSubtotal(0);
      setSavings(0);
      return;
    }

    try {
      setLoading(true);
      const data = await api.cart.get();
      if (data.success) {
        setCartCourses(data.courses || []);
        setSubtotal(data.subtotal || 0);
        setSavings(data.savings || 0);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [user]);

  const addToCart = async (courseId: string) => {
    if (!user) {
      toastError('Please login to add courses to your cart.');
      return;
    }

    try {
      const data = await api.cart.add(courseId);
      if (data.success) {
        success('Course added to cart!');
        await refreshCart();
      }
    } catch (err: any) {
      toastError(err.message || 'Could not add to cart.');
    }
  };

  const removeFromCart = async (courseId: string) => {
    try {
      const data = await api.cart.remove(courseId);
      if (data.success) {
        success('Item removed from cart.');
        await refreshCart();
      }
    } catch (err: any) {
      toastError(err.message || 'Could not remove item.');
    }
  };

  const clearCart = async () => {
    try {
      await api.cart.clear();
      setCartCourses([]);
      setSubtotal(0);
      setSavings(0);
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const isInCart = (courseId: string) => {
    return cartCourses.some((c) => c.id === courseId);
  };

  return (
    <CartContext.Provider
      value={{
        cartCourses,
        cartCount: cartCourses.length,
        subtotal,
        savings,
        loading,
        addToCart,
        removeFromCart,
        clearCart,
        refreshCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
