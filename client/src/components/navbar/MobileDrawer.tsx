import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Heart, ShoppingBag, Bell, LayoutDashboard, ShieldCheck, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: Array<{ name: string; path: string }>;
  unreadNotifications: number;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  navLinks,
  unreadNotifications,
}) => {
  const { user, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <Link to="/" onClick={onClose} className="flex items-center">
              <img
                src="/logo.png"
                alt="Lo Samajh Lo"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info if logged in */}
          {user && (
            <div className="my-4 p-3.5 rounded-xl bg-purple-50/60 border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6C63FF] text-white font-bold flex items-center justify-center text-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="space-y-1 my-4">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-[#6C63FF] text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Action Quick Links */}
          <div className="border-t border-slate-100 pt-4 space-y-1">
            <Link
              to="/wishlist"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-[#FF6584]" />
                <span>Wishlist</span>
              </div>
              {wishlistCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-pink-100 text-[#FF6584] text-xs font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-[#6C63FF]" />
                <span>Cart</span>
              </div>
              {cartCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#6C63FF] text-xs font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              to="/notifications"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Notifications</span>
              </div>
              {unreadNotifications > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  {unreadNotifications} new
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Bottom Auth Section */}
        <div className="border-t border-slate-100 pt-4">
          {user ? (
            <div className="space-y-2">
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#1a1a2e] hover:bg-slate-800"
                >
                  <ShieldCheck className="w-4 h-4 text-[#FF6584]" />
                  Admin Panel
                </Link>
              )}
              <Link
                to="/dashboard"
                onClick={onClose}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                Dashboard
              </Link>
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div>
              <Link
                to="/login"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#8f88ff] text-white text-sm font-bold text-center shadow-md shadow-[#6C63FF]/30 hover:opacity-95 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Login / Register (लॉग इन / नया खाता)</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
