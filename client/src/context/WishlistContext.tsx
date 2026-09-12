import React, { createContext, useContext, useState, useEffect } from 'react';
import { Course } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useCart } from './CartContext';

interface WishlistContextType {
  wishlistCourses: Course[];
  wishlistCount: number;
  loading: boolean;
  toggleWishlist: (courseId: string) => Promise<void>;
  moveToCart: (courseId: string) => Promise<void>;
  isWishlisted: (courseId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const { success, error: toastError } = useToast();
  const [wishlistCourses, setWishlistCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshWishlist = async () => {
    if (!user) {
      setWishlistCourses([]);
      return;
    }

    try {
      setLoading(true);
      const data = await api.wishlist.get();
      if (data.success) {
        setWishlistCourses(data.courses || []);
      }
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshWishlist();
  }, [user]);

  const toggleWishlist = async (courseId: string) => {
    if (!user) {
      toastError('Please login to save courses to your wishlist.');
      return;
    }

    try {
      const data = await api.wishlist.toggle(courseId);
      if (data.success) {
        success(data.message);
        await refreshWishlist();
      }
    } catch (err: any) {
      toastError(err.message || 'Could not update wishlist.');
    }
  };

  const moveToCart = async (courseId: string) => {
    try {
      const data = await api.wishlist.moveToCart(courseId);
      if (data.success) {
        success('Moved to cart!');
        await refreshWishlist();
        await refreshCart();
      }
    } catch (err: any) {
      toastError(err.message || 'Could not move to cart.');
    }
  };

  const isWishlisted = (courseId: string) => {
    return wishlistCourses.some((c) => c.id === courseId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistCourses,
        wishlistCount: wishlistCourses.length,
        loading,
        toggleWishlist,
        moveToCart,
        isWishlisted,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
