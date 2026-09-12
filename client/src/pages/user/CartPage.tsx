import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Tag,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartCourses, removeFromCart, clearCart, subtotal, savings, refreshCart } = useCart();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl text-center space-y-4 border border-slate-200 shadow-sm">
        <ShoppingBag className="w-12 h-12 text-[#6C63FF] mx-auto" />
        <h3 className="font-bold text-lg text-slate-800">Please Sign In</h3>
        <p className="text-xs text-slate-500">You must be logged in to access your shopping cart and complete enrollments.</p>
        <Link to="/login" className="inline-block px-6 py-2.5 rounded-xl bg-[#6C63FF] text-white font-bold text-xs shadow">
          Log In Now
        </Link>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 sm:p-10 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-5 animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Payment Successful!</h2>
          <p className="text-xs text-slate-500 mt-1">Order #{orderSuccess.orderNumber} confirmed.</p>
          <p className="text-sm font-semibold text-emerald-600 mt-2">
            You have been successfully enrolled in all purchased batches.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs space-y-2">
          <div className="flex justify-between text-slate-600">
            <span>Transaction ID:</span>
            <span className="font-mono font-bold text-slate-800">{orderSuccess.transactionId}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Amount Paid:</span>
            <span className="font-bold text-slate-900">₹{orderSuccess.totalAmount}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 py-3 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white font-bold text-xs shadow-md transition-all"
          >
            Go to My Courses
          </button>
          <button
            onClick={() => {
              setOrderSuccess(null);
              navigate('/courses');
            }}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
          >
            Explore More
          </button>
        </div>
      </div>
    );
  }

  if (cartCourses.length === 0) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl text-center space-y-4 border border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-purple-50 text-[#6C63FF] mx-auto flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-xl text-slate-800">Your Cart is Empty</h3>
        <p className="text-xs text-slate-500">You have no courses in your cart right now. Browse our courses catalog to get started.</p>
        <Link to="/courses" className="inline-block px-6 py-2.5 rounded-xl bg-[#6C63FF] text-white font-bold text-xs shadow-md shadow-[#6C63FF]/30">
          Browse Courses
        </Link>
      </div>
    );
  }

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    try {
      setApplyingPromo(true);
      const data = await api.promo.validate(promoInput.trim(), subtotal);
      if (data.success && data.promo) {
        setAppliedPromo(data.promo);
        success(data.message);
      }
    } catch (err: any) {
      toastError(err.message || 'Invalid promo voucher.');
    } finally {
      setApplyingPromo(false);
    }
  };

  const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleCheckout = async () => {
    try {
      setCheckingOut(true);
      const courseIds = cartCourses.map((c) => c.id);

      const data = await api.orders.checkout({
        courseIds,
        promoCode: appliedPromo ? appliedPromo.code : null,
        paymentMethod: 'ONLINE_UPI',
      });

      if (data.success && data.order) {
        setOrderSuccess(data.order);
        await refreshCart();
      }
    } catch (err: any) {
      toastError(err.message || 'Checkout failed.');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Shopping Cart</h1>
        <p className="text-sm text-slate-500 mt-1">Review your selected courses and proceed to instant enrollment.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cartCourses.map((course) => {
            const price = course.discountedPrice !== null && course.discountedPrice !== undefined
              ? course.discountedPrice
              : course.price;

            return (
              <div
                key={course.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <img
                    src={course.thumbnail || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300'}
                    alt={course.title}
                    className="w-24 h-16 rounded-xl object-cover flex-shrink-0 bg-slate-100"
                  />
                  <div className="overflow-hidden">
                    <Link to={`/courses/${course.slug}`}>
                      <h3 className="font-bold text-sm text-slate-900 hover:text-[#6C63FF] line-clamp-1">
                        {course.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">Instructor: {course.instructorName}</p>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {course.validityDays} Days Validity
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900">₹{price}</span>
                    {course.discountedPrice && course.price > course.discountedPrice && (
                      <span className="text-xs text-slate-400 line-through block">₹{course.price}</span>
                    )}
                  </div>

                  <button
                    onClick={() => removeFromCart(course.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove from Cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-500 hover:underline"
            >
              Clear Cart
            </button>
            <Link
              to="/courses"
              className="text-xs font-bold text-[#6C63FF] hover:underline flex items-center gap-1"
            >
              Continue Shopping <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Summary Card */}
        <div className="lg:col-span-4 space-y-5 sticky top-24">
          {/* Promo Code Input */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Tag className="w-4 h-4 text-[#6C63FF]" />
              <span>Apply Promo Code</span>
            </div>

            <form onSubmit={handleApplyCoupon} className="flex items-center gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME10"
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:outline-none focus:border-[#6C63FF]"
              />
              <button
                type="submit"
                disabled={applyingPromo}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
              >
                {applyingPromo ? 'Checking...' : 'Apply'}
              </button>
            </form>

            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Sparkles className="w-3 h-3 text-[#FF6584]" />
              <span>Try code <span className="font-bold text-[#6C63FF]">WELCOME10</span> or <span className="font-bold text-[#6C63FF]">RAILWAY50</span></span>
            </div>

            {appliedPromo && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between font-bold">
                <span>Code {appliedPromo.code} Applied</span>
                <span>-₹{appliedPromo.discountAmount}</span>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal ({cartCourses.length} Items):</span>
                <span className="font-bold text-slate-800">₹{subtotal}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount:</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Platform Access Fee:</span>
                <span className="text-emerald-600 font-bold">FREE</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-sm font-bold text-slate-800">Total Payable:</span>
              <span className="text-2xl font-black text-slate-900">₹{finalTotal}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#8f88ff] hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-[#6C63FF]/30 transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{checkingOut ? 'Securing Enrollment...' : 'Proceed to Checkout & Pay'}</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% Secure Transaction • Razorpay Simulated Gateway</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
