import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, Clock, AlertTriangle, CheckCircle2, Play, Search, BookOpen } from 'lucide-react';
import { api } from '../../services/api';
import { Test } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const TestSeriesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const data = await api.tests.getAll();
        if (data.success) {
          setTests(data.tests || []);
        }
      } catch (err) {
        console.error('Error fetching tests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const filteredTests = tests.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#6C63FF]">
          TEST ENGINE & PRACTICE
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
          Online Mock Test Series
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Full length exam simulators with exact time limits, negative marking, instant grading, and complete explanations.
        </p>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm max-w-lg">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-xl border border-slate-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mock tests by exam (e.g. PET, Railway)..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none"
          />
        </div>
      </div>

      {/* Grid of Tests */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredTests.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-100 text-[#6C63FF]">
                    {test.category?.name || 'All India Mock'}
                  </span>
                  <span className="text-xs font-black text-emerald-600">FREE TEST</span>
                </div>

                <h3 className="font-bold text-base text-slate-900 line-clamp-2 leading-snug">
                  {test.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {test.description}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#6C63FF]" />
                    <span>{test.durationMinutes} Mins</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#FF6584]" />
                    <span>{test.totalMarks} Total Marks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                    <span>{test.questionsCount || 10} Questions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>-{test.negativeMarking} Neg. Mark</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {test.userHighestScore !== null && test.userHighestScore !== undefined ? (
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                      Best Score: {test.userHighestScore}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Not attempted yet</span>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (!user) {
                      navigate('/login');
                    } else {
                      navigate(`/test-series/${test.id}/attempt`);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#8f88ff] text-white font-bold text-xs shadow-md shadow-[#6C63FF]/30 hover:opacity-95 transition-all hover:scale-[1.02]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Test</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 max-w-md mx-auto space-y-3">
          <Award className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800">No Tests Found</h3>
          <p className="text-xs text-slate-500">No test matches your search. Please check back later.</p>
        </div>
      )}
    </div>
  );
};

export default TestSeriesPage;
