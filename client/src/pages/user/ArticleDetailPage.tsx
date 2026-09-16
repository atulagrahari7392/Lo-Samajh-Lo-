import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Download,
  BookOpen,
  Award,
  FileText,
  Share2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { EducationArticle, Course, TestSeries, Material } from '../../types';
import { useToast } from '../../context/ToastContext';

export const ArticleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { success } = useToast();

  const [article, setArticle] = useState<EducationArticle | null>(null);
  const [related, setRelated] = useState<{
    courses: Course[];
    testSeries: TestSeries[];
    materials: Material[];
    recentUpdates: any[];
  }>({ courses: [], testSeries: [], materials: [], recentUpdates: [] });

  const [loading, setLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    if (!slug) return;

    const fetchArticle = async () => {
      try {
        setLoading(true);
        const data = await api.notifications.getArticle(slug);
        if (data.success && data.article) {
          setArticle(data.article);
          if (data.related) {
            setRelated(data.related);
          }
          // Record view count
          if (data.article.id) {
            api.notifications.recordArticleView(data.article.id);
          }
        } else {
          navigate('/notifications');
        }
      } catch (err) {
        console.error('Failed to load article:', err);
        navigate('/notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug, navigate]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      success('Article link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6 animate-pulse">
        <div className="h-4 w-48 bg-slate-200 rounded"></div>
        <div className="h-10 w-3/4 bg-slate-200 rounded"></div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-40 bg-slate-100 rounded-2xl"></div>
            <div className="h-64 bg-slate-100 rounded-2xl"></div>
          </div>
          <div className="space-y-4">
            <div className="h-48 bg-slate-100 rounded-2xl"></div>
            <div className="h-48 bg-slate-100 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) return null;

  const info = article.structuredInfo || {};
  const faqs = Array.isArray(article.faqData) ? article.faqData : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto pb-1">
        <Link to="/" className="hover:text-[#6C63FF] transition-colors whitespace-nowrap">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
        <Link to="/notifications" className="hover:text-[#6C63FF] transition-colors whitespace-nowrap">Notifications</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
        <span className="text-slate-900 font-bold truncate">{article.organizationName || 'Update'}</span>
      </nav>

      {/* 2. Article Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-purple-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-purple-100 text-[#6C63FF]">
              {article.category.replace(/_/g, ' ')}
            </span>
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 uppercase">
              {article.organizationName}
            </span>
            {article.state && (
              <span className="px-3 py-1 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                {article.state}
              </span>
            )}
          </div>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Published: {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Recently'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified from Official Source ({article.lastVerifiedAt ? new Date(article.lastVerifiedAt).toLocaleDateString('en-IN') : 'Today'})</span>
          </div>

          {article.notificationNumber && (
            <div className="text-slate-400">
              <span>Advt No: </span>
              <span className="font-bold text-slate-700">{article.notificationNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Two-Column Main Content Layout */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Full Content & Structured Tables (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Summary Callout */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/50 to-pink-50/30 border border-purple-200/80 shadow-xs space-y-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#6C63FF] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Quick Summary / संक्षिप्त विवरण</span>
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {article.excerpt}
            </p>
          </div>

          {/* Important Dates Timeline Table */}
          {article.dates && article.dates.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <h2 className="text-sm font-black tracking-tight">Important Dates Timeline</h2>
                </div>
                <span className="text-[11px] text-slate-400">Indian Standard Time</span>
              </div>

              <div className="divide-y divide-slate-100">
                {article.dates.map((d) => (
                  <div key={d.id} className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 transition-colors">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">{d.label}</h3>
                      {d.source && <span className="text-[11px] text-slate-400">{d.source}</span>}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-slate-800">
                        {new Date(d.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      {d.deadlineStatus && (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap ${d.deadlineStatus.badgeColor}`}>
                          {d.deadlineStatus.statusText}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Structured Recruitment Info Cards */}
          {(info.vacancy || info.eligibility || info.ageLimit || info.fee || info.selectionProcess) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                Key Notification Highlights & Eligibility
              </h2>

              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                {info.vacancy && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="font-black text-slate-400 uppercase text-[10px]">Total Vacancies</span>
                    <p className="font-bold text-slate-800 text-sm">{info.vacancy}</p>
                  </div>
                )}
                {info.eligibility && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="font-black text-slate-400 uppercase text-[10px]">Educational Qualification</span>
                    <p className="font-bold text-slate-800 text-sm">{info.eligibility}</p>
                  </div>
                )}
                {info.ageLimit && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="font-black text-slate-400 uppercase text-[10px]">Age Limit Criteria</span>
                    <p className="font-bold text-slate-800 text-sm">{info.ageLimit}</p>
                  </div>
                )}
                {info.fee && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="font-black text-slate-400 uppercase text-[10px]">Application Fee</span>
                    <p className="font-bold text-slate-800 text-sm">{info.fee}</p>
                  </div>
                )}
              </div>

              {info.selectionProcess && (
                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/60 space-y-1 text-xs">
                  <span className="font-black text-[#6C63FF] uppercase text-[10px]">Selection Mode & Stages</span>
                  <p className="font-semibold text-slate-800 text-sm">{info.selectionProcess}</p>
                </div>
              )}
            </div>
          )}

          {/* Syllabus Breakdown */}
          {article.syllabus && article.syllabus.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <BookOpen className="w-5 h-5 text-[#6C63FF]" />
                <h2 className="text-base font-black text-slate-900">Syllabus & Exam Scheme</h2>
              </div>

              <div className="space-y-4">
                {article.syllabus.map((s, index) => {
                  let subtopicsList: string[] = [];
                  try {
                    subtopicsList = typeof s.subtopics === 'string' ? JSON.parse(s.subtopics) : s.subtopics;
                  } catch {
                    subtopicsList = [];
                  }

                  return (
                    <div key={s.id || index} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] text-xs flex items-center justify-center font-black">
                          {index + 1}
                        </span>
                        <span>{s.topic}</span>
                      </h3>
                      {subtopicsList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1 pl-7">
                          {subtopicsList.map((st, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-medium">
                              {st}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FAQs Accordion */}
          {faqs.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <HelpCircle className="w-5 h-5 text-[#6C63FF]" />
                <h2 className="text-base font-black text-slate-900">Frequently Asked Questions (FAQs)</h2>
              </div>

              <div className="space-y-2">
                {faqs.map((faq, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl overflow-hidden transition-all">
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                      className="w-full px-4 py-3 text-left font-bold text-xs sm:text-sm text-slate-800 hover:bg-slate-50 flex items-center justify-between gap-3"
                    >
                      <span>Q: {faq.question}</span>
                      {openFaqIndex === i ? <ChevronUp className="w-4 h-4 text-[#6C63FF]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    {openFaqIndex === i && (
                      <div className="px-4 py-3 bg-purple-50/40 border-t border-slate-100 text-xs text-slate-600 leading-relaxed font-medium">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Official Verification Notice */}
          <div className="p-4 rounded-xl bg-slate-100 text-slate-600 text-xs space-y-1">
            <span className="font-bold text-slate-800">Source Verification Note:</span>
            <p>
              This information is compiled directly from the official notification circular released by{' '}
              <span className="font-bold text-slate-900">{article.organizationName}</span>. Lo Samajh Lo always recommends candidates review the primary PDF notification before submitting online applications.
            </p>
          </div>
        </div>

        {/* Right Column: Quick Action Links & Related LMS Modules (1 Col) */}
        <div className="space-y-6">
          {/* Important Links Box */}
          <div className="bg-white rounded-2xl border border-purple-200 p-5 shadow-sm space-y-4">
            <h2 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-[#6C63FF]" />
              <span>Official Links & Portals</span>
            </h2>

            <div className="space-y-2">
              {article.links && article.links.length > 0 ? (
                article.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-50 hover:bg-[#6C63FF] text-[#6C63FF] hover:text-white font-bold text-xs transition-all border border-purple-200 hover:border-[#6C63FF] shadow-xs group"
                  >
                    <span className="line-clamp-1">{link.label}</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  </a>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-2">Official links verified from authority portal.</div>
              )}
            </div>
          </div>

          {/* Related LMS Courses */}
          {related.courses.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h2 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>Recommended Courses for Exam</span>
              </h2>

              <div className="space-y-3">
                {related.courses.map((c) => (
                  <Link
                    key={c.id}
                    to={`/courses/${c.slug}`}
                    className="block p-3 rounded-xl border border-slate-200/80 hover:border-[#6C63FF] hover:bg-purple-50/20 transition-all group"
                  >
                    <h3 className="font-bold text-xs text-slate-900 group-hover:text-[#6C63FF] transition-colors line-clamp-2">
                      {c.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 mt-2">
                      <span className="text-[#6C63FF]">₹{c.discountedPrice || c.price}</span>
                      <span className="text-[10px] text-slate-400 group-hover:text-[#6C63FF]">Explore Course →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Test Series */}
          {related.testSeries.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h2 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Target Mock Tests</span>
              </h2>

              <div className="space-y-3">
                {related.testSeries.map((ts) => (
                  <Link
                    key={ts.id}
                    to="/test-series"
                    className="block p-3 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all group"
                  >
                    <h3 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                      {ts.title}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mt-2">
                      <span>{ts.totalTestsCount} Tests</span>
                      <span className="text-emerald-600">Start Practicing →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Free Study Notes */}
          {related.materials.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h2 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Free Study Materials</span>
              </h2>

              <div className="space-y-2">
                {related.materials.map((m) => (
                  <a
                    key={m.id}
                    href={m.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 text-xs font-bold text-slate-700 hover:text-[#6C63FF] transition-all"
                  >
                    <span className="truncate pr-2">{m.title}</span>
                    <Download className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Recent Newsroom Circulars */}
          {related.recentUpdates.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h2 className="font-black text-xs uppercase tracking-wider text-slate-400">
                Other Live Circulars
              </h2>

              <div className="space-y-2.5">
                {related.recentUpdates.map((ru) => (
                  <Link
                    key={ru.id}
                    to={`/notifications/${ru.slug}`}
                    className="block text-xs font-bold text-slate-700 hover:text-[#6C63FF] transition-colors line-clamp-2 border-b border-slate-100 pb-2"
                  >
                    {ru.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleDetailPage;
