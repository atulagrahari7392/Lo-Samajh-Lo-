import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  RefreshCw,
  BookOpen,
  Award,
} from 'lucide-react';
import { api } from '../../services/api';
import { Question, Test } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const AdminQuestionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTestId = searchParams.get('testId') || '';

  const { success, error: toastError } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [selectedTestId, setSelectedTestId] = useState(initialTestId);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Question fields
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [explanation, setExplanation] = useState('');
  const [subject, setSubject] = useState('General Studies');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [marks, setMarks] = useState(1.0);
  const [negativeMarks, setNegativeMarks] = useState(0.25);
  const [assignTestId, setAssignTestId] = useState('');
  const [sectionName, setSectionName] = useState('General');

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      if (subjectFilter.trim()) params.subject = subjectFilter.trim();
      if (difficultyFilter) params.difficulty = difficultyFilter;
      if (selectedTestId) params.testId = selectedTestId;

      const data = await api.questions.getAll(params);
      if (data.success) {
        setQuestions(data.questions || []);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const fetchTests = async () => {
    try {
      const data = await api.tests.adminGetAll();
      if (data.success) {
        setTests(data.tests || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, subjectFilter, difficultyFilter, selectedTestId]);

  const openCreateModal = () => {
    setEditingQuestion(null);
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectIndex(0);
    setExplanation('');
    setSubject('General Studies');
    setTopic('');
    setDifficulty('MEDIUM');
    setMarks(1.0);
    setNegativeMarks(0.25);
    setAssignTestId(selectedTestId || (tests.length > 0 ? tests[0].id : ''));
    setSectionName('General');
    setIsModalOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setQuestionText(q.questionText);

    let opts: string[] = [];
    if (Array.isArray(q.options)) {
      opts = [...q.options];
    } else if (typeof q.options === 'string') {
      try {
        opts = JSON.parse(q.options);
      } catch {
        opts = [q.options];
      }
    }
    while (opts.length < 4) opts.push('');
    setOptions(opts);

    // Find correct answer index
    const foundIdx = opts.findIndex((o) => o === q.correctAnswer);
    setCorrectIndex(foundIdx >= 0 ? foundIdx : 0);

    setExplanation(q.explanation || '');
    setSubject(q.subject || 'General Studies');
    setTopic(q.topic || '');
    setDifficulty(q.difficulty || 'MEDIUM');
    setMarks(q.marks ?? 1.0);
    setNegativeMarks(q.negativeMarks ?? 0.25);
    setIsModalOpen(true);
  };

  const handleOptionChange = (index: number, val: string) => {
    const newOptions = [...options];
    newOptions[index] = val;
    setOptions(newOptions);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      toastError('Question text is required.');
      return;
    }

    const filledOptions = options.map((o) => o.trim()).filter(Boolean);
    if (filledOptions.length < 2) {
      toastError('Please provide at least 2 options.');
      return;
    }

    const chosenCorrect = options[correctIndex]?.trim();
    if (!chosenCorrect) {
      toastError('Please select a valid non-empty correct answer.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        questionText: questionText.trim(),
        options: options.map((o) => o.trim()),
        correctAnswer: chosenCorrect,
        explanation: explanation.trim() || null,
        marks,
        negativeMarks,
        difficulty,
        subject: subject.trim() || 'General',
        topic: topic.trim() || null,
        testId: assignTestId || undefined,
        sectionName: sectionName.trim() || undefined,
      };

      if (editingQuestion) {
        const res = await api.questions.update(editingQuestion.id, payload);
        if (res.success) {
          success('Question updated successfully!');
          setIsModalOpen(false);
          fetchQuestions();
        }
      } else {
        const res = await api.questions.create(payload);
        if (res.success) {
          success('Question created and added to question bank!');
          setIsModalOpen(false);
          fetchQuestions();
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to save question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await api.questions.delete(deleteId);
      if (res.success) {
        setQuestions((prev) => prev.filter((q) => q.id !== deleteId));
        success('Question removed from repository.');
        setDeleteId(null);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to delete question');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <HelpCircle className="w-7 h-7 text-[#6C63FF]" />
              Question Bank & Problem Repository
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Author bilingual MCQs, solutions, assign marks, and link to mock test papers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchQuestions}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6C63FF] to-[#8f88ff] text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search question text or solution..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={selectedTestId}
              onChange={(e) => {
                setSelectedTestId(e.target.value);
                setSearchParams(e.target.value ? { testId: e.target.value } : {});
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30"
            >
              <option value="">All Test Series</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30"
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6C63FF]" />
              Loading questions repository...
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              No questions found matching your criteria. Click "Add Question" to create your first question.
            </div>
          ) : (
            questions.map((q, idx) => {
              let parsedOptions: string[] = [];
              if (Array.isArray(q.options)) {
                parsedOptions = q.options;
              } else if (typeof q.options === 'string') {
                try {
                  parsedOptions = JSON.parse(q.options);
                } catch {
                  parsedOptions = [q.options];
                }
              }

              const diffColors: Record<string, string> = {
                EASY: 'bg-emerald-100 text-emerald-700',
                MEDIUM: 'bg-amber-100 text-amber-700',
                HARD: 'bg-rose-100 text-rose-700',
              };

              return (
                <div
                  key={q.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                        Q{idx + 1}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#6C63FF]">
                        {q.subject}
                      </span>
                      {q.topic && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {q.topic}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          diffColors[q.difficulty] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        +{q.marks} / -{q.negativeMarks} Marks
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(q)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Question"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(q.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <h3 className="font-bold text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">
                    {q.questionText}
                  </h3>

                  {/* Options Grid */}
                  <div className="grid sm:grid-cols-2 gap-2 pt-1">
                    {parsedOptions.map((opt, oIdx) => {
                      const isCorrect = opt === q.correctAnswer;
                      const letter = String.fromCharCode(65 + oIdx);
                      return (
                        <div
                          key={oIdx}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs transition-colors ${
                            isCorrect
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold'
                              : 'bg-slate-50 border-slate-100 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation snippet */}
                  {q.explanation && (
                    <div className="bg-purple-50/60 p-3 rounded-xl text-xs text-purple-900 border border-purple-100">
                      <span className="font-bold block mb-0.5 text-purple-800">Explanation / Solution:</span>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal: Add or Edit Question */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6C63FF] flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingQuestion ? 'Edit Question' : 'Add Question to Question Bank'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Question Statement (Hindi / English) *</label>
                  <textarea
                    rows={3}
                    required
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Enter full question text..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#6C63FF]/30 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">
                    Options & Correct Answer (Select radio for correct option) *
                  </label>
                  <div className="space-y-2">
                    {options.map((opt, i) => {
                      const letter = String.fromCharCode(65 + i);
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correctAnswerOption"
                            checked={correctIndex === i}
                            onChange={() => setCorrectIndex(i)}
                            className="w-4 h-4 text-[#6C63FF] focus:ring-[#6C63FF]"
                            title="Select as correct option"
                          />
                          <span className="w-6 text-xs font-bold text-slate-500">{letter}:</span>
                          <input
                            type="text"
                            required={i < 2}
                            value={opt}
                            onChange={(e) => handleOptionChange(i, e.target.value)}
                            placeholder={`Option ${letter} text...`}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#6C63FF]/30 outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Subject *</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. General Hindi"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Topic</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Sandhi Viched"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                    >
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Marks</label>
                    <input
                      type="number"
                      step="0.25"
                      min={0}
                      value={marks}
                      onChange={(e) => setMarks(parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Negative Marks</label>
                    <input
                      type="number"
                      step="0.05"
                      min={0}
                      value={negativeMarks}
                      onChange={(e) => setNegativeMarks(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>

                  {!editingQuestion && (
                    <>
                      <div className="space-y-1 sm:col-span-1">
                        <label className="text-xs font-bold text-slate-700">Link to Test</label>
                        <select
                          value={assignTestId}
                          onChange={(e) => setAssignTestId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                        >
                          <option value="">Do Not Assign</option>
                          {tests.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1 sm:col-span-1">
                        <label className="text-xs font-bold text-slate-700">Section Name</label>
                        <input
                          type="text"
                          value={sectionName}
                          onChange={(e) => setSectionName(e.target.value)}
                          placeholder="e.g. General Hindi"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Solution / Detailed Explanation</label>
                  <textarea
                    rows={3}
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Explain why the answer is correct so students learn from mistakes..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#6C63FF] hover:bg-[#584fd4] transition-colors shadow-sm disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingQuestion ? 'Update Question' : 'Save Question'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteId}
          title="Delete Question"
          message="Are you sure you want to delete this question? It will be removed from all associated mock tests."
          confirmText="Delete Question"
          isDestructive={true}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminQuestionsPage;
