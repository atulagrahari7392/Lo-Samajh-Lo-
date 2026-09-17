import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ShoppingBag,
  Heart,
  Bell,
  User as UserIcon,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { api } from '../../services/api';
import MobileDrawer from './MobileDrawer';

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const data = await api.notifications.getAll();
        if (data.success) {
          setUnreadNotifications(data.unreadCount || 0);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchNotifs();
  }, [location.pathname, user]);

  const navLinks = [
    { name: t('nav.home', 'Home'), path: '/' },
    { name: t('nav.courses', 'Courses'), path: '/courses' },
    { name: t('nav.studyMaterials', 'Study Materials'), path: '/study-materials' },
    { name: t('nav.testSeries', 'Test Series'), path: '/test-series' },
    { name: t('nav.typingTest', 'Typing Test'), path: '/typing-test' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center group py-1">
            <img
              src="/logo.png"
              alt="Lo Samajh Lo — India's Trusted Learning Platform"
              className="h-12 sm:h-14 w-auto object-contain group-hover:scale-105 transition-transform drop-shadow-sm"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isActive(link.path)
                    ? 'bg-[#6C63FF]/10 text-[#6C63FF]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-2.5">
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2.5 rounded-xl text-slate-600 hover:text-[#FF6584] hover:bg-pink-50 transition-colors"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF6584] text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl text-slate-600 hover:text-[#6C63FF] hover:bg-indigo-50 transition-colors"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#6C63FF] text-white text-[11px] font-bold flex items-center justify-center shadow-sm animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <Link
              to="/notifications"
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-[#6C63FF] hover:bg-indigo-50 transition-colors group"
              title="Notifications & Updates"
            >
              <div className="relative">
                <Bell className="w-5 h-5 group-hover:text-[#6C63FF] transition-colors" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6584] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF6584]"></span>
                  </span>
                )}
              </div>
              <span className="hidden md:inline text-xs font-bold uppercase tracking-wider text-slate-700 group-hover:text-[#6C63FF] transition-colors">
                Update
              </span>
              {unreadNotifications > 0 && (
                <span className="hidden md:inline-flex px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#FF6584] text-white">
                  {unreadNotifications}
                </span>
              )}
            </Link>

            {/* Language Switcher */}
            <LanguageSwitcher className="hidden sm:inline-flex" />

            {/* User Account / Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-sm font-semibold text-slate-700 shadow-sm"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6C63FF] to-[#FF6584] text-white font-bold flex items-center justify-center text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <span className="max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">{t('auth.loginTitle', 'Signed in as')}</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-[#6C63FF]">
                        {user.role}
                      </span>
                    </div>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-[#6C63FF] hover:bg-purple-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {t('nav.adminPanel', 'Admin Control Panel')}
                      </Link>
                    )}

                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      {t('nav.dashboard', 'Student Dashboard')}
                    </Link>

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('nav.logout', 'Sign Out')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#6C63FF] to-[#8f88ff] hover:opacity-95 shadow-md shadow-[#6C63FF]/30 transition-all hover:scale-[1.02] flex items-center gap-1.5"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{t('nav.login', 'Login')}</span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navLinks={navLinks}
        unreadNotifications={unreadNotifications}
      />
    </header>
  );
};

export default Navbar;
