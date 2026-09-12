import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Star, ShoppingBag, Heart, CheckCircle2, PlayCircle } from 'lucide-react';
import { Course } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const navigate = useNavigate();

  const inCart = isInCart(course.id) || course.isInCart;
  const wishlisted = isWishlisted(course.id) || course.isWishlisted;
  const enrolled = course.isEnrolled;

  const currentPrice = course.discountedPrice !== null && course.discountedPrice !== undefined
    ? course.discountedPrice
    : course.price;

  const discountPercent = course.discountedPrice && course.price > course.discountedPrice
    ? Math.round(((course.price - course.discountedPrice) / course.price) * 100)
    : 0;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Thumbnail & Badges */}
        <div className="relative aspect-video overflow-hidden bg-slate-100">
          <img
            src={course.thumbnail || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600'}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Category Badge */}
          {course.category && (
            <span
              className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: course.category.color || '#6C63FF' }}
            >
              {course.category.name}
            </span>
          )}

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(course.id);
            }}
            className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all ${
              wishlisted
                ? 'bg-rose-500 text-white'
                : 'bg-black/30 text-white hover:bg-black/50'
            }`}
            title="Save to Wishlist"
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
          </button>

          {/* Discount Tag */}
          {discountPercent > 0 && (
            <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-[#FF6584] text-white text-[11px] font-extrabold shadow">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-[#6C63FF]" />
              {course.duration || '60+ Hours'}
            </span>
            <div className="flex items-center gap-1 font-semibold text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>4.9</span>
              <span className="text-slate-400">({course._count?.reviews || 28})</span>
            </div>
          </div>

          <Link to={`/courses/${course.slug}`}>
            <h3 className="font-bold text-base text-slate-900 line-clamp-2 hover:text-[#6C63FF] transition-colors leading-snug">
              {course.title}
            </h3>
          </Link>

          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
            {course.shortDescription}
          </p>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600 line-clamp-1">
              👨‍🏫 <span className="font-bold text-slate-800">{course.instructorName}</span>
            </span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex-shrink-0">
              {course.validityDays}d Validity
            </span>
          </div>
        </div>
      </div>

      {/* Pricing & Footer Actions */}
      <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          {currentPrice === 0 ? (
            <span className="text-base font-extrabold text-emerald-600">FREE</span>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-slate-900">₹{currentPrice}</span>
              {course.discountedPrice && course.price > course.discountedPrice && (
                <span className="text-xs text-slate-400 line-through">₹{course.price}</span>
              )}
            </div>
          )}
        </div>

        <div>
          {enrolled ? (
            <Link
              to={`/courses/${course.slug}/learn`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Start Learning
            </Link>
          ) : inCart ? (
            <button
              onClick={() => navigate('/cart')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-100 text-[#6C63FF] hover:bg-purple-200 text-xs font-bold transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Go to Cart
            </button>
          ) : (
            <button
              onClick={() => addToCart(course.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white text-xs font-bold shadow-sm shadow-[#6C63FF]/30 transition-all hover:scale-[1.02]"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
