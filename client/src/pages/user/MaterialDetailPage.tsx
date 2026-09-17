import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  BookOpen,
  Bookmark,
  Share2,
  Check,
  Eye,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  BookMarked,
  Maximize2,
  FileCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { Material } from '../../types';
import { PdfReaderModal } from '../../components/materials/PdfReaderModal';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';

export const MaterialDetailPage: React.FC = () => {
  const { isHindi, t } = useLanguage();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [material, setMaterial] = useState<Material | null>(null);
  const [relatedMaterials, setRelatedMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadsCount, setDownloadsCount] = useState(0);

  useEffect(() => {
    if (!slug) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await api.materials.getBySlug(slug);
        if (res.success && res.material) {
          setMaterial(res.material);
          setIsBookmarked(!!res.material.isBookmarked);
          setDownloadsCount(res.material.downloadsCount || 0);
          setRelatedMaterials(res.relatedMaterials || []);
        } else {
          toastError('Study material not found.');
        }
      } catch (err: any) {
        console.error('Error loading material:', err);
        toastError(err.message || 'Failed to load study material.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const handleDownload = async () => {
    if (!material) return;
    try {
      const res = await api.materials.incrementDownload(material.id);
      if (res.success) {
        setDownloadsCount(res.downloadsCount);
      }
    } catch (e) {
      console.error(e);
    }
    const link = document.createElement('a');
    link.href = material.fileUrl;
    link.target = '_blank';
    link.download = `${material.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Download started!');
  };

  const handleBookmark = async () => {
    if (!material) return;
    try {
      const res = await api.materials.toggleBookmark(material.id);
      if (res.success) {
        setIsBookmarked(res.isBookmarked);
        toastSuccess(res.isBookmarked ? 'Saved to My Library' : 'Removed from My Library');
      }
    } catch (err: any) {
      toastError(err.message || 'Please log in to save materials');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toastSuccess('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-8 bg-slate-200 rounded w-3/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96 bg-slate-200 rounded-2xl"></div>
            <div className="h-96 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {isHindi ? 'अध्ययन सामग्री उपलब्ध नहीं है' : 'Study Material Not Found'}
        </h2>
        <p className="text-slate-500 mb-6">
          {isHindi ? 'अनुरोधित अध्ययन सामग्री नहीं मिली या हटा दी गई है।' : 'Requested study material not found or might have been removed.'}
        </p>
        <button
          onClick={() => navigate('/study-materials')}
          className="px-6 py-2.5 rounded-xl bg-[#6C63FF] text-white font-bold text-sm shadow-md hover:opacity-90"
        >
          {isHindi ? '← अध्ययन सामग्री पर वापस जाएं' : '← Back to Study Materials'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Structured Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 overflow-x-auto whitespace-nowrap pb-1">
          <Link to="/" className="hover:text-[#6C63FF] transition">{t('nav.home', 'Home')}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link to="/study-materials" className="hover:text-[#6C63FF] transition">{t('nav.studyMaterials', 'Study Materials')}</Link>
          {material.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <Link to={`/study-materials?category=${material.category.slug}`} className="hover:text-[#6C63FF] transition">
                {isHindi ? (material.category.nameHi || material.category.name) : material.category.name}
              </Link>
            </>
          )}
          {material.classGrade && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-600 font-medium">{material.classGrade}</span>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-900 font-semibold truncate max-w-xs">{material.title}</span>
        </nav>

        {/* Back Button */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#6C63FF] transition bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isHindi ? 'पीछे जाएँ' : 'Back'}</span>
          </button>
        </div>

        {/* Hero Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Left Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Information Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              {/* Badges & Meta */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] text-xs font-extrabold tracking-wide uppercase">
                  {material.materialType?.replace('_', ' ') || 'NOTES'}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  {material.isFree ? (isHindi ? '100% निःशुल्क PDF' : '100% Free PDF') : (isHindi ? 'प्रीमियम' : 'Premium')}
                </span>
                {material.language && (
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                    {material.language}
                  </span>
                )}
                {material.isFeatured && (
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Featured</span>
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {material.title}
              </h1>

              {/* Description */}
              {material.description && (
                <p className="text-base text-slate-600 leading-relaxed bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                  {material.description}
                </p>
              )}

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {/* Read Online Button */}
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(true)}
                  className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#6C63FF] to-indigo-600 text-white font-bold text-sm shadow-md hover:brightness-105 active:scale-95 transition"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{t('study.readOnline', isHindi ? 'ऑनलाइन पढ़ें' : 'Read Online')}</span>
                </button>

                {/* Direct Download Button */}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md active:scale-95 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>{isHindi ? `डाउनलोड करें (${material.fileSize})` : `Download (${material.fileSize})`}</span>
                </button>

                {/* Save / Bookmark Button */}
                <button
                  type="button"
                  onClick={handleBookmark}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-center gap-2 text-sm font-bold active:scale-95 ${
                    isBookmarked
                      ? 'bg-rose-50 text-rose-600 border-rose-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={isBookmarked ? (isHindi ? 'पुस्तकालय में सहेजा गया' : 'Saved to My Library') : (isHindi ? 'सहेजें' : 'Save')}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  <span className="hidden sm:inline">{isBookmarked ? (isHindi ? 'सहेजा गया' : 'Saved') : (isHindi ? 'सहेजें' : 'Save')}</span>
                </button>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="p-3.5 rounded-2xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition flex items-center justify-center gap-2 text-sm font-bold active:scale-95"
                  title={isHindi ? 'सामग्री साझा करें' : 'Share Material'}
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  <span className="hidden sm:inline">{copied ? (isHindi ? 'कॉपी किया' : 'Copied') : (isHindi ? 'साझा करें' : 'Share')}</span>
                </button>
              </div>

              {/* Embedded Document Preview / Reader Section */}
              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#6C63FF]" />
                    <h3 className="text-base font-bold text-slate-900">
                      {isHindi ? 'दस्तावेज़ पूर्वावलोकन' : 'Document In-Browser Preview'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsPdfModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6C63FF] hover:underline"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>{isHindi ? 'पूर्ण स्क्रीन में खोलें' : 'Open in Fullscreen'}</span>
                  </button>
                </div>

                <div className="w-full h-96 sm:h-[480px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 relative shadow-inner">
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(
                      material.fileUrl.startsWith('http') ? material.fileUrl : window.location.origin + material.fileUrl
                    )}&embedded=true`}
                    title={material.title}
                    className="w-full h-full border-none bg-white"
                  />
                </div>
              </div>

              {/* Extended Chapter / Topic Detailed Content */}
              {material.fullContent && (
                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <h3 className="text-base font-bold text-slate-900">
                    {isHindi ? 'विषय सार एवं मुख्य बिंदु' : 'Overview & Key Points'}
                  </h3>
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-5 rounded-2xl border border-slate-100">
                    {material.fullContent}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Academic Specifications & Metadata */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              <h3 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-[#6C63FF]" />
                <span>{isHindi ? 'अध्ययन विवरण' : 'Academic Specifications'}</span>
              </h3>

              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">{isHindi ? 'विषय' : 'Subject'}</span>
                  <span className="text-slate-900 font-bold">{material.subject}</span>
                </div>

                {material.classGrade && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">{isHindi ? 'कक्षा' : 'Class'}</span>
                    <span className="text-slate-900 font-bold">{material.classGrade}</span>
                  </div>
                )}

                {material.chapter && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">{isHindi ? 'अध्याय' : 'Chapter'}</span>
                    <span className="text-slate-900 font-bold text-right truncate max-w-[180px]" title={material.chapter}>
                      {material.chapter}
                    </span>
                  </div>
                )}

                {material.topic && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">{isHindi ? 'टॉपिक' : 'Topic'}</span>
                    <span className="text-slate-900 font-bold text-right truncate max-w-[180px]" title={material.topic}>
                      {material.topic}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">{isHindi ? 'लक्षित परीक्षा' : 'Target Exam'}</span>
                  <span className="text-slate-900 font-bold text-right">{material.examName}</span>
                </div>

                {material.year && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">{isHindi ? 'वर्ष' : 'Year'}</span>
                    <span className="text-slate-900 font-bold">{material.year}</span>
                  </div>
                )}

                {material.shift && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">{isHindi ? 'पाली' : 'Shift'}</span>
                    <span className="text-slate-900 font-bold">{material.shift}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">{isHindi ? 'माध्यम' : 'Language'}</span>
                  <span className="text-slate-900 font-bold">{material.language || (isHindi ? 'हिंदी / अंग्रेजी' : 'Hindi / English')}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">{isHindi ? 'कुल पृष्ठ' : 'Total Pages'}</span>
                  <span className="text-slate-900 font-bold">{material.pageCount || 1} {isHindi ? 'पृष्ठ' : 'Pages'}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">{isHindi ? 'फ़ाइल साइज़' : 'File Size'}</span>
                  <span className="text-slate-900 font-bold">{material.fileSize} ({material.fileType})</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">{isHindi ? 'डाउनलोड्स' : 'Total Downloads'}</span>
                  <span className="text-emerald-700 font-black flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    {downloadsCount.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 font-medium">{isHindi ? 'व्यूज' : 'Total Views'}</span>
                  <span className="text-blue-700 font-bold flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {(material.viewsCount || 1).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Lo Samajh Lo Quality Guarantee */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-purple-50/70 border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-indigo-900">
                  <ShieldCheck className="w-4 h-4 text-[#6C63FF]" />
                  <span>{isHindi ? 'प्रमाणित अध्ययन सामग्री (100% सत्यापित)' : 'Verified Study Material (100% Verified)'}</span>
                </div>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  {isHindi
                    ? 'यह सामग्री Lo Samajh Lo विशेषज्ञ शिक्षकों एवं टॉपर्स द्वारा नवीनतम पाठ्यक्रम और परीक्षा पैटर्न के अनुसार तैयार व सत्यापित की गई है।'
                    : 'This material has been prepared and verified by Lo Samajh Lo expert educators and toppers in accordance with the latest syllabus and examination pattern.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Materials Section */}
        {relatedMaterials.length > 0 && (
          <div className="pt-8 border-t border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {isHindi ? 'संबंधित अध्ययन सामग्री' : 'Related Study Materials'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {isHindi
                    ? 'इस विषय और कक्षा से जुड़े अन्य महत्वपूर्ण नोट्स एवं पिछले वर्षों के प्रश्न पत्र।'
                    : 'Other important notes and previous years question papers related to this subject and class.'}
                </p>
              </div>
              <Link
                to="/study-materials"
                className="text-xs sm:text-sm font-bold text-[#6C63FF] hover:underline"
              >
                {isHindi ? 'सभी देखें →' : 'View All →'}
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedMaterials.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                        {item.materialType?.replace('_', ' ') || 'NOTES'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {item.fileSize}
                      </span>
                    </div>

                    <Link
                      to={`/study-materials/${item.slug || item.id}`}
                      className="text-sm font-bold text-slate-900 group-hover:text-[#6C63FF] line-clamp-2 transition leading-snug"
                    >
                      {item.title}
                    </Link>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {item.description || (isHindi ? 'महत्वपूर्ण परीक्षा उपयोगी नोट्स।' : 'Important exam preparation notes.')}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      {item.subject}
                    </span>
                    <Link
                      to={`/study-materials/${item.slug || item.id}`}
                      className="px-3 py-1.5 rounded-xl bg-[#6C63FF]/10 text-[#6C63FF] font-bold text-xs hover:bg-[#6C63FF] hover:text-white transition"
                    >
                      {isHindi ? 'देखें' : 'View'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* In-Browser PDF Reader Modal */}
      <PdfReaderModal
        material={material}
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onBookmarkToggle={(id) => setIsBookmarked(prev => !prev)}
      />
    </div>
  );
};

export default MaterialDetailPage;
