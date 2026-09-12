import React, { useState, useEffect } from 'react';
import { Award, Clock, Keyboard, History, CheckCircle2, Zap } from 'lucide-react';
import { api } from '../../services/api';
import { TypingTest, TypingAttempt } from '../../types';
import TypingEngine from '../../components/typing/TypingEngine';
import { useAuth } from '../../context/AuthContext';

export const TypingTestPage: React.FC = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<TypingTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<TypingTest | null>(null);
  const [history, setHistory] = useState<TypingAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const data = await api.typing.getAll();
      if (data.success && data.tests?.length > 0) {
        setTests(data.tests);
        setSelectedTest(data.tests[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const data = await api.typing.getMyHistory();
      if (data.success) {
        setHistory(data.attempts || []);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchTests();
    fetchHistory();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-[#6C63FF] text-xs font-bold border border-purple-200 mb-2">
          <Keyboard className="w-4 h-4" />
          <span>SSC, UP Police & High Court Typing Benchmark</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Online Typing Speed Test Engine
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Real-time WPM calculation, accuracy tracking, error counting, and historical analytics in English and Hindi.
        </p>
      </div>

      {/* Passage Selector Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {tests.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTest(t)}
            className={`p-4 rounded-2xl border text-left min-w-[260px] transition-all flex flex-col justify-between space-y-2 ${
              selectedTest?.id === t.id
                ? 'bg-[#1a1a2e] text-white border-[#1a1a2e] shadow-lg shadow-slate-900/20'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  selectedTest?.id === t.id ? 'bg-[#FF6584] text-white' : 'bg-purple-100 text-[#6C63FF]'
                }`}
              >
                {t.language}
              </span>
              <span className="text-[11px] font-medium opacity-75">{t.difficulty}</span>
            </div>
            <h4 className="font-bold text-xs line-clamp-1">{t.title}</h4>
          </button>
        ))}
      </div>

      {/* Main Typing Engine */}
      {selectedTest && (
        <TypingEngine
          key={selectedTest.id}
          test={selectedTest}
          onFinished={fetchHistory}
        />
      )}

      {/* Attempt History Section */}
      {user && history.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-[#6C63FF]" />
              <h3 className="font-bold text-lg text-slate-900">Your Typing Test History</h3>
            </div>
            <span className="text-xs text-slate-400">{history.length} Sessions Logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Test Name</th>
                  <th className="p-3.5">Net Speed</th>
                  <th className="p-3.5">Gross Speed</th>
                  <th className="p-3.5">Accuracy</th>
                  <th className="p-3.5">Errors</th>
                  <th className="p-3.5 rounded-r-xl">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {history.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-900">
                      {att.typingTest?.title || 'Typing Practice'}
                    </td>
                    <td className="p-3.5 font-black text-[#6C63FF] text-sm">
                      {att.netWpm} WPM
                    </td>
                    <td className="p-3.5 text-slate-700">{att.wpm} WPM</td>
                    <td className="p-3.5 text-emerald-600 font-bold">{att.accuracy}%</td>
                    <td className="p-3.5 text-rose-500 font-bold">{att.errors}</td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(att.createdAt).toLocaleDateString()} at{' '}
                      {new Date(att.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TypingTestPage;
