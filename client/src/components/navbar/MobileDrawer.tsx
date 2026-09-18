import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Heart, ShoppingBag, Bell, LayoutDashboard, ShieldCheck, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

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
  const { t } = useLanguage();
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#061530]/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-in-right">
        {/* Top gradient accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#0B2A63] via-[#DC2626] to-[#D97706]" />

        <div className="p-6 flex-1">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <Link to="/" onClick={onClose} className="flex items-center">
              <img
                src="/logo.png"
                alt="Lo Samajh Lo"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-[#DC2626] hover:bg-red-50 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Language Switcher */}
          <div className="py-3 border-b border-slate-100 flex justify-center">
            <LanguageSwitcher variant="full" className="w-full justify-center" />
          </div>

          {/* User info if logged in */}
          {user && (
            <div className="my-4 p-3.5 rounded-xl bg-gradient-to-br from-[#0B2A63]/08 to-[#1D4ED8]/05 border border-[#0B2A63]/12">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B2A63] to-[#DC2626] text-white font-bold flex items-center justify-center text-sm">
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
              const active = location.pathname === link.path ||
                (link.path !== '/' && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[#0B2A63] to-[#1D4ED8] text-white shadow-[0_4px_12px_rgba(11,42,99,0.3)]'
                      : 'text-slate-700 hover:bg-[#0B2A63]/06 hover:text-[#0B2A63]'
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
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-[#DC2626] transition-all"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-[#DC2626]" />
                <span>{t('nav.wishlist')}</span>
              </div>
              {wishlistCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-[#DC2626] text-xs font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-[#0B2A63]/06 hover:text-[#0B2A63] transition-all"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-[#0B2A63]" />
                <span>{t('nav.cart')}</span>
              </div>
              {cartCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#0B2A63]/10 text-[#0B2A63] text-xs font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              to="/notifications"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-all"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-[#D97706]" />
                <span>{t('nav.notifications')}</span>
              </div>
              {unreadNotifications > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  {unreadNotifications}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Bottom Auth Section */}
        <div className="border-t border-slate-100 p-6 pt-4">
          {user ? (
            <div className="space-y-2">
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#0B2A63] to-[#1D4ED8] hover:from-[#061530] hover:to-[#0B2A63] shadow-[0_4px_12px_rgba(11,42,99,0.3)] transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                  {t('nav.adminPanel')}
                </Link>
              )}
              <Link
                to="/dashboard"
                onClick={onClose}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                {t('nav.dashboard')}
              </Link>
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <div>
              <Link
                to="/login"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0B2A63] to-[#1D4ED8] text-white text-sm font-bold text-center shadow-[0_4px_14px_rgba(11,42,99,0.4)] hover:from-[#DC2626] hover:to-[#ef4444] transition-all duration-300"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('nav.loginRegister')}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
