import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Home, BookOpen, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full text-center space-y-6 animate-in zoom-in-95">
        <div className="w-20 h-20 rounded-3xl bg-purple-100 text-[#6C63FF] mx-auto flex items-center justify-center font-black text-3xl shadow-inner">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Page Not Found</h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            The page you are looking for might have been removed, renamed, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6C63FF] text-white font-bold text-xs shadow-md hover:bg-[#584fd4] transition-all"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            Explore Courses
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
