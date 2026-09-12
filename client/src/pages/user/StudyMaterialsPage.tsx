import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  FileText,
  BookOpen,
  Sparkles,
  Layers,
  Brain,
  FlaskConical,
  Dna,
  TrendingUp,
  Scale,
  Users,
  Globe,
  Landmark,
  BookMarked,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { Material } from '../../types';

export const StudyMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);

  // Drishti-IAS inspired colorful subject tiles
  const subjectTiles = [
    { id: '', nameEn: 'All Notes', nameHi: 'सभी अध्ययन सामग्री', icon: BookOpen, gradient: 'from-[#6C63FF] to-[#8f88ff]', badge: 'All PDFs' },
    { id: 'Psychology', nameEn: 'Psychology', nameHi: 'मनोविज्ञान', icon: Brain, gradient: 'from-pink-500 to-rose-600', badge: 'बाल विकास' },
    { id: 'Science', nameEn: 'Gen Science', nameHi: 'सामान्य विज्ञान', icon: FlaskConical, gradient: 'from-emerald-500 to-teal-600', badge: 'भौतिकी व रसायन' },
    { id: 'Biology', nameEn: 'Biology', nameHi: 'जीव विज्ञान', icon: Dna, gradient: 'from-teal-500 to-cyan-600', badge: 'जूलॉजी व बॉटनी' },
    { id: 'Economics', nameEn: 'Economics', nameHi: 'अर्थशास्त्र', icon: TrendingUp, gradient: 'from-amber-500 to-orange-600', badge: 'बजट व नीति' },
    { id: 'Polity', nameEn: 'Polity', nameHi: 'राजव्यवस्था व संविधान', icon: Scale, gradient: 'from-blue-600 to-indigo-700', badge: 'संविधान' },
    { id: 'Sociology', nameEn: 'Sociology', nameHi: 'समाजशास्त्र', icon: Users, gradient: 'from-violet-600 to-purple-700', badge: 'सामाजिक मुद्दे' },
    { id: 'Geography', nameEn: 'Geography', nameHi: 'भारत का भूगोल', icon: Globe, gradient: 'from-green-600 to-emerald-700', badge: 'नदियां व नक्शे' },
    { id: 'History', nameEn: 'History', nameHi: 'भारतीय इतिहास', icon: Landmark, gradient: 'from-rose-600 to-red-700', badge: 'आधुनिक इतिहास' },
    { id: 'Hindi', nameEn: 'Hindi Grammar', nameHi: 'सामान्य हिन्दी', icon: BookMarked, gradient: 'from-orange-500 to-amber-600', badge: 'व्याकरण व गद्य' },
    { id: 'General Awareness', nameEn: 'Current Affairs', nameHi: 'समसामयिकी', icon: Sparkles, gradient: 'from-sky-500 to-blue-600', badge: 'दैनिक संकलन' },
  ];

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedSubject) params.subject = selectedSubject;

      const data = await api.materials.getAll(params);
      if (data.success) {
        setMaterials(data.materials || []);
      }
    } catch (err) {
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [selectedSubject]);

  const handleDownload = async (mat: Material) => {
    try {
      await api.materials.incrementDownload(mat.id);
      window.open(mat.fileUrl, '_blank');
    } catch (e) {
      window.open(mat.fileUrl, '_blank');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>मुफ्त पीडीएफ ई-बुक्स एवं हस्तलिखित क्लास नोट्स</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Study Materials & Handwritten Notes
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">
            Drishti IAS शैली में विषयवार संकलित नोट्स, NCERT सार, PYQ गाइड और महत्वपूर्ण फॉर्मूला शीट्स।
          </p>
        </div>

        {/* Quick Search */}
        <form
          onSubmit={(e) => { e.preventDefault(); fetchMaterials(); }}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-slate-200 shadow-sm w-full md:w-80"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="खोजें (e.g. इतिहास, संविधान, PET)..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded-xl bg-[#6C63FF] text-white font-bold text-xs shadow-sm hover:opacity-90"
          >
            खोजें
          </button>
        </form>
      </div>

      {/* Drishti IAS-Style Colorful Subject Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#6C63FF]" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
              विषय चुनें / Select Subject (दृष्टि IAS शैली)
            </h2>
          </div>
          {selectedSubject && (
            <button
              onClick={() => setSelectedSubject('')}
              className="text-xs font-bold text-[#6C63FF] hover:underline"
            >
              सभी विषय दिखाएं (Show All)
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {subjectTiles.map((tile) => {
            const Icon = tile.icon;
            const isSelected = selectedSubject === tile.id;

            return (
              <button
                key={tile.nameEn}
                onClick={() => setSelectedSubject(tile.id)}
                className={`group relative p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between h-32 overflow-hidden shadow-sm hover:shadow-md border ${
                  isSelected
                    ? 'ring-2 ring-[#6C63FF] border-transparent scale-[1.02] shadow-lg'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                }`}
              >
                {/* Decorative background gradient accent */}
                <div
                  className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-gradient-to-tr ${tile.gradient} opacity-15 group-hover:scale-125 transition-transform`}
                />

                <div className="flex items-center justify-between z-10">
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${tile.gradient} text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {tile.badge}
                  </span>
                </div>

                <div className="z-10 mt-2">
                  <h3 className="font-black text-sm text-slate-900 group-hover:text-[#6C63FF] transition-colors leading-tight">
                    {tile.nameHi}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold">{tile.nameEn}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Materials Cards List */}
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              {loading ? 'लोड हो रहा है...' : `${materials.length} पुस्तकें एवं नोट्स उपलब्ध`}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-60 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : materials.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((mat) => (
              <div
                key={mat.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
              >
                {/* Top colored accent line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#6C63FF] to-[#FF6584]" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-purple-100 text-[#6C63FF]">
                      {mat.subject}
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold">
                      {mat.downloadsCount || 0} Downloads
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[#6C63FF] flex-shrink-0 group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 line-clamp-2 leading-snug group-hover:text-[#6C63FF] transition-colors">
                        {mat.title}
                      </h3>
                      {mat.examName && (
                        <span className="text-xs font-semibold text-slate-500 mt-1 block">
                          लक्ष्य: {mat.examName}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {mat.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] uppercase">
                      {mat.fileType || 'PDF'}
                    </span>
                    <span>{mat.fileSize || '3.2 MB'}</span>
                  </div>

                  <button
                    onClick={() => handleDownload(mat)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white font-bold text-xs shadow-md shadow-[#6C63FF]/30 transition-all hover:scale-[1.02]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 max-w-md mx-auto space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800">कोई अध्ययन सामग्री नहीं मिली</h3>
            <p className="text-xs text-slate-500">
              इस विषय में अभी सामग्री जोड़ी जा रही है। कृपया दूसरे विषय का चयन करें।
            </p>
            <button
              onClick={() => setSelectedSubject('')}
              className="px-4 py-2 rounded-xl bg-[#6C63FF] text-white font-bold text-xs"
            >
              सभी विषय देखें
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterialsPage;
