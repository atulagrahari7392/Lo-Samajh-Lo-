import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mail, Phone, MapPin, Heart, ArrowRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand & About */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block py-1">
              <img
                src="/logo.png"
                alt="Lo Samajh Lo — अब पढ़ाई होगी आसान"
                className="h-14 sm:h-16 w-auto object-contain drop-shadow-md"
              />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              India's premier digital learning platform dedicated to competitive exams (UPSSSC, Railway, SSC, UP Police) and graduation studies. Concept-based learning with comprehensive study materials, live mock tests, and bilingual notes.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#6C63FF]" /> Raebareli, Uttar Pradesh
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-[#6C63FF]" /> support@losamajhlo.in
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Quick Navigation</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/courses" className="hover:text-white transition-colors">Courses Catalog</Link>
              </li>
              <li>
                <Link to="/study-materials" className="hover:text-white transition-colors">Free Study Materials</Link>
              </li>
              <li>
                <Link to="/test-series" className="hover:text-white transition-colors">Online Test Series</Link>
              </li>
              <li>
                <Link to="/typing-test" className="hover:text-white transition-colors">Typing Speed Test</Link>
              </li>
              <li>
                <Link to="/notifications" className="hover:text-white transition-colors">Exam Notifications</Link>
              </li>
            </ul>
          </div>

          {/* Target Exams */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Target Exams</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/courses?category=upsssc" className="hover:text-white transition-colors">UPSSSC PET 2026</Link>
              </li>
              <li>
                <Link to="/courses?category=railway" className="hover:text-white transition-colors">RRB NTPC & Group D</Link>
              </li>
              <li>
                <Link to="/courses?category=ssc" className="hover:text-white transition-colors">SSC GD & CGL</Link>
              </li>
              <li>
                <Link to="/courses?category=up-police" className="hover:text-white transition-colors">UP Police Constable & SI</Link>
              </li>
              <li>
                <Link to="/courses?category=graduation" className="hover:text-white transition-colors">B.A. / B.Sc. Degree</Link>
              </li>
            </ul>
          </div>

          {/* Contact / Newsletter */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Stay Connected</h4>
            <p className="text-xs text-slate-400 mb-3">
              Subscribe to get immediate alerts for new government job vacancies and test updates.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed for updates!'); }} className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#6C63FF]"
                required
              />
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white font-bold text-xs shadow-sm transition-all"
              >
                <span>Subscribe Alerts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Lo Samajh Lo (लो समझ लो). All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Made with <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" /> for Indian Aspirants</span>
            <Link to="/login" className="hover:text-slate-400">Student Portal</Link>
            <Link to="/login" className="hover:text-slate-400">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
