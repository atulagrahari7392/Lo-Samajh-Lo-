import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const WishlistPage: React.FC = () => {
  const { wishlistCourses, toggleWishlist, moveToCart } = useWishlist();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl text-center space-y-4 border border-slate-200">
        <Heart className="w-12 h-12 text-[#FF6584] mx-auto" />
        <h3 className="font-bold text-lg text-slate-800">Please Sign In</h3>
        <p className="text-xs text-slate-500">Sign in to save and access your desired courses.</p>
        <Link to="/login" className="inline-block px-6 py-2.5 rounded-xl bg-[#6C63FF] text-white font-bold text-xs shadow">
          Sign In
        </Link>
      </div>
    );
  }

  if (wishlistCourses.length === 0) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl text-center space-y-4 border border-slate-200">
        <div className="w-16 h-16 rounded-full bg-pink-50 text-[#FF6584] mx-auto flex items-center justify-center">
          <Heart className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-xl text-slate-900">Your Wishlist is Empty</h3>
        <p className="text-xs text-slate-500">Explore our exam batches and bookmark courses for future enrollment.</p>
        <Link to="/courses" className="inline-block px-6 py-2.5 rounded-xl bg-[#6C63FF] text-white font-bold text-xs shadow-md shadow-[#6C63FF]/30">
          Browse Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Saved Courses (Wishlist)</h1>
        <p className="text-sm text-slate-500 mt-1">{wishlistCourses.length} courses saved for future learning.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistCourses.map((course) => {
          const price = course.discountedPrice !== null && course.discountedPrice !== undefined
            ? course.discountedPrice
            : course.price;

          return (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                <img
                  src={course.thumbnail || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600'}
                  alt={course.title}
                  className="w-full aspect-video object-cover"
                />
                <div className="p-5 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C63FF] bg-purple-50 px-2.5 py-0.5 rounded">
                    {course.category?.name || 'Exam Prep'}
                  </span>
                  <Link to={`/courses/${course.slug}`}>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 hover:text-[#6C63FF] line-clamp-2 leading-snug">
                      {course.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-400">Instructor: {course.instructorName}</p>
                </div>
              </div>

              <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-lg font-black text-slate-900">₹{price}</span>
                  {course.discountedPrice && course.price > course.discountedPrice && (
                    <span className="text-xs text-slate-400 line-through ml-2">₹{course.price}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleWishlist(course.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveToCart(course.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white font-bold text-xs shadow-sm"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Move to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WishlistPage;
