import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, Play } from 'lucide-react';
import { SliderBanner } from '../../types';
import { api } from '../../services/api';
import { formatImageUrl, handleImageError } from '../../utils/image';
import { useLanguage } from '../../context/LanguageContext';

const FALLBACK_SLIDES: SliderBanner[] = [
  {
    id: '1',
    title: 'UPSSSC PET 2026 संपूर्ण सिलेक्शन लाइव बैच',
    subtitle: 'लाइव कक्षाएं, द्विभाषी हस्तलिखित क्लास नोट्स, अध्यायवार PYQs एवं 50+ फुल-लेंथ ऑनलाइन मॉक टेस्ट।',
    badge: '🔥 2026 NEW BATCH OPEN',
    buttonText: 'Explore Courses',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400',
    linkUrl: '/courses',
    position: 1,
    isActive: true,
  },
  {
    id: '2',
    title: 'All India Live CBT Mock Test Series 2026',
    subtitle: 'NTA व SSC पैटर्न पर आधारित ऑनलाइन परीक्षा इंजन, तुरंत एक्यूरेसी %, रैंक एवं विस्तृत समाधान।',
    badge: '🎯 100% FREE ALL INDIA MOCK',
    buttonText: 'Attempt Free Test',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1400',
    linkUrl: '/test-series',
    position: 2,
    isActive: true,
  },
  {
    id: '3',
    title: 'दृष्टि IAS शैली में हस्तलिखित पीडीएफ नोट्स व पुस्तकें',
    subtitle: 'मनोविज्ञान, सामान्य विज्ञान, जीव विज्ञान, अर्थव्यवस्था, संविधान, भूगोल व इतिहास के रंग-बिरंगे सार नोट्स।',
    badge: '📚 FREE STUDY MATERIALS',
    buttonText: 'Download Notes',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1400',
    linkUrl: '/study-materials',
    position: 3,
    isActive: true,
  },
];

export const HeroSlider: React.FC = () => {
  const { isHindi, t } = useLanguage();
  const [slides, setSlides] = useState<SliderBanner[]>(FALLBACK_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    api.sliders.getAll().then((res) => {
      if (res.success && res.sliders && res.sliders.length > 0) {
        setSlides(res.sliders);
      }
    }).catch(() => {
      // Use fallback slides
    });
  }, []);

  const totalSlides = slides.length;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(timerRef.current);
  }, [totalSlides, isPaused]);

  const getButtonText = (btnText?: string | null) => {
    if (!btnText) return isHindi ? 'अभी शुरू करें' : 'Enroll Now';
    if (btnText.includes(' / ')) {
      const [enPart, hiPart] = btnText.split(' / ');
      return isHindi && hiPart ? hiPart.trim() : enPart.trim();
    }
    if (isHindi) {
      if (btnText === 'Explore Courses') return 'कोर्स देखें';
      if (btnText === 'Attempt Free Test') return 'मॉक टेस्ट दें';
      if (btnText === 'Download Notes') return 'नोट्स डाउनलोड करें';
    }
    return btnText;
  };

  if (totalSlides === 0) return null;

  const current = slides[currentIndex];

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl shadow-2xl border border-slate-200/80 bg-slate-900 group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slide Container */}
      <div className="relative min-h-[420px] sm:min-h-[440px] md:h-[480px] w-full">
        {slides.map((slide, idx) => {
          const isCurrent = idx === currentIndex;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isCurrent ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              {/* Image with rich overlay */}
              <div className="absolute inset-0 z-0">
                <img
                  src={formatImageUrl(slide.imageUrl)}
                  alt={slide.title}
                  onError={handleImageError()}
                  className="w-full h-full object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
              </div>

              {/* Content Container */}
              <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full py-8">
                <div className="max-w-2xl space-y-3 sm:space-y-4">
                  {/* Badge */}
                  {slide.badge && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#FF6584] border border-white/15 text-[11px] sm:text-xs font-black tracking-wider uppercase">
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      <span>{slide.badge}</span>
                    </div>
                  )}

                  {/* Title */}
                  <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
                    {slide.title}
                  </h2>

                  {/* Subtitle */}
                  {slide.subtitle && (
                    <p className="text-xs sm:text-base text-slate-300 line-clamp-2 max-w-xl leading-relaxed">
                      {slide.subtitle}
                    </p>
                  )}

                  {/* CTA Action Button */}
                  <div className="pt-1 flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <Link
                      to={slide.linkUrl || '/courses'}
                      className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#6C63FF] via-[#7d75ff] to-[#FF6584] hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-xl shadow-[#6C63FF]/40 transition-all hover:scale-105 active:scale-95"
                    >
                      <span>{getButtonText(slide.buttonText)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      to="/test-series"
                      className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-xs border border-white/20 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-[#FF6584]" />
                      <span>{isHindi ? 'मुफ़्त मॉक टेस्ट' : 'Free Mock Test'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-lg transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-lg transition-all hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Bottom Dots Indicator Bar */}
      {totalSlides > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
          {slides.map((_, dotIdx) => (
            <button
              key={dotIdx}
              onClick={() => setCurrentIndex(dotIdx)}
              aria-label={`Go to slide ${dotIdx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                dotIdx === currentIndex
                  ? 'w-7 bg-gradient-to-r from-[#6C63FF] to-[#FF6584]'
                  : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSlider;
