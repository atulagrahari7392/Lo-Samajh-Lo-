import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  UploadCloud,
  FileSpreadsheet,
  Download,
  ArrowLeft,
  Clock,
  Award,
  Layers,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../../services/api';
import { Question, Test } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const AdminTestQuestionsPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters within this test
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  // -------------------------------------------------------------
  // 1. Manual Add / Edit Question Modal State
  // -------------------------------------------------------------
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  const [questionText, setQuestionText] = useState('');
  const [questionHindi, setQuestionHindi] = useState('');
  const [questionEnglish, setQuestionEnglish] = useState('');
  const [questionType, setQuestionType] = useState('MCQ_SINGLE');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [explanation, setExplanation] = useState('');
  const [subject, setSubject] = useState('General Studies');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [marks, setMarks] = useState(1.0);
  const [negativeMarks, setNegativeMarks] = useState(0.25);
  const [sectionName, setSectionName] = useState('General');

  // -------------------------------------------------------------
  // 2. Bulk Upload Questions Modal State (CSV / Excel / JSON)
  // -------------------------------------------------------------
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<'file' | 'text'>('file');
  const [bulkText, setBulkText] = useState('');
  const [bulkSectionName, setBulkSectionName] = useState('General');
  const [bulkParsed, setBulkParsed] = useState<any[]>([]);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // 3. Import from Question Bank Modal State
  // -------------------------------------------------------------
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [bankSubject, setBankSubject] = useState('');
  const [bankDifficulty, setBankDifficulty] = useState('');
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [bankTargetSection, setBankTargetSection] = useState('General');
  const [importingBank, setImportingBank] = useState(false);

  // -------------------------------------------------------------
  // Delete / Unlink Modals
  // -------------------------------------------------------------
  const [unlinkQuestionId, setUnlinkQuestionId] = useState<string | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);

  // Fetch test details and its questions
  const fetchTestData = async () => {
    if (!testId) return;
    try {
      setLoading(true);
      const [testRes, qRes] = await Promise.all([
        api.tests.getById(testId),
        api.questions.getAll({ testId }),
      ]);

      if (testRes.success && testRes.test) {
        setTest(testRes.test);
        setMarks(testRes.test.totalMarks && testRes.test.questionsCount ? Number((testRes.test.totalMarks / Math.max(testRes.test.questionsCount, 1)).toFixed(2)) : 1.0);
        setNegativeMarks(testRes.test.negativeMarking || 0.25);
      }

      if (qRes.success && qRes.questions) {
        setQuestions(qRes.questions);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load test questions data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestData();
  }, [testId]);

  // Unique sections in current questions
  const uniqueSections = Array.from(
    new Set(questions.map((q) => q.sectionName || 'General').filter(Boolean))
  );

  // Filtered list of questions in current test
  const filteredQuestions = questions.filter((q) => {
    if (search.trim()) {
      const s = search.toLowerCase();
      const matchText = (q.questionText || '').toLowerCase().includes(s);
      const matchHindi = (q.questionHindi || '').toLowerCase().includes(s);
      const matchEnglish = (q.questionEnglish || '').toLowerCase().includes(s);
      const matchSubj = (q.subject || '').toLowerCase().includes(s);
      const matchTopic = (q.topic || '').toLowerCase().includes(s);
      if (!matchText && !matchHindi && !matchEnglish && !matchSubj && !matchTopic) return false;
    }
    if (sectionFilter && (q.sectionName || 'General') !== sectionFilter) return false;
    if (difficultyFilter && q.difficulty !== difficultyFilter) return false;
    return true;
  });

  // -------------------------------------------------------------
  // Manual Question Modal Openers
  // -------------------------------------------------------------
  const openAddQuestionModal = () => {
    setEditingQuestion(null);
    setQuestionText('');
    setQuestionHindi('');
    setQuestionEnglish('');
    setQuestionType('MCQ_SINGLE');
    setOptions(['', '', '', '']);
    setCorrectIndex(0);
    setExplanation('');
    setSubject(test?.series?.examCategory ? `${test.series.examCategory} General` : 'General Studies');
    setTopic('');
    setDifficulty('MEDIUM');
    setMarks(test ? 1.0 : 1.0);
    setNegativeMarks(test?.negativeMarking || 0.25);
    setSectionName('General');
    setIsQuestionModalOpen(true);
  };

  const openEditQuestionModal = (q: Question) => {
    setEditingQuestion(q);
    setQuestionText(q.questionText || '');
    setQuestionHindi(q.questionHindi || '');
    setQuestionEnglish(q.questionEnglish || '');
    setQuestionType(q.questionType || 'MCQ_SINGLE');

    const opts = Array.isArray(q.options) && q.options.length > 0 ? q.options : ['', '', '', ''];
    setOptions(opts);

    const corr = parseInt(q.correctAnswer, 10);
    setCorrectIndex(isNaN(corr) ? 0 : corr);

    setExplanation(q.explanation || '');
    setSubject(q.subject || 'General Studies');
    setTopic(q.topic || '');
    setDifficulty(q.difficulty || 'MEDIUM');
    setMarks(q.marks || 1.0);
    setNegativeMarks(q.negativeMarks || 0.25);
    setSectionName(q.sectionName || 'General');
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      toastError('Question text is required.');
      return;
    }

    const cleanOptions = options.map((o) => o.trim());
    if (cleanOptions.some((o) => !o)) {
      toastError('Please fill all 4 options.');
      return;
    }

    try {
      setSubmittingQuestion(true);
      const payload = {
        questionText: questionText.trim(),
        questionHindi: questionHindi.trim() || null,
        questionEnglish: questionEnglish.trim() || null,
        questionType,
        options: cleanOptions,
        correctAnswer: String(correctIndex),
        explanation: explanation.trim() || null,
        marks: Number(marks) || 1.0,
        negativeMarks: Number(negativeMarks) || 0.25,
        difficulty,
        subject: subject.trim() || 'General',
        topic: topic.trim() || null,
        testId,
        sectionName: sectionName.trim() || 'General',
      };

      if (editingQuestion) {
        const res = await api.questions.update(editingQuestion.id, payload);
        if (res.success) {
          success('Question updated successfully!');
          setIsQuestionModalOpen(false);
          fetchTestData();
        }
      } else {
        const res = await api.questions.create(payload);
        if (res.success) {
          success('New question created and bound to this test!');
          setIsQuestionModalOpen(false);
          fetchTestData();
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to save question.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  // -------------------------------------------------------------
  // Bulk Upload Parsing (Excel / CSV / JSON)
  // -------------------------------------------------------------
  const parseRowsToQuestions = (rows: any[]) => {
    const results: any[] = [];

    for (const r of rows) {
      const qText =
        r.questionText ||
        r['Question Text'] ||
        r.question ||
        r.Question ||
        r['question_text'] ||
        r[0];

      if (!qText || String(qText).trim() === '') continue;

      const op1 = r.optionA || r['Option A'] || r.option1 || r.Option1 || r['option_a'] || r[1];
      const op2 = r.optionB || r['Option B'] || r.option2 || r.Option2 || r['option_b'] || r[2];
      const op3 = r.optionC || r['Option C'] || r.option3 || r.Option3 || r['option_c'] || r[3];
      const op4 = r.optionD || r['Option D'] || r.option4 || r.Option4 || r['option_d'] || r[4];

      if (!op1 || !op2) continue;

      const corrRaw =
        r.correctAnswer ||
        r['Correct Answer'] ||
        r.correctOption ||
        r['correctOption(1-4)'] ||
        r.Answer ||
        r.answer ||
        r[5] ||
        '1';

      let corrIdx = 0;
      const cStr = String(corrRaw).trim().toUpperCase();
      if (['A', '1', 'OPT A'].includes(cStr)) corrIdx = 0;
      else if (['B', '2', 'OPT B'].includes(cStr)) corrIdx = 1;
      else if (['C', '3', 'OPT C'].includes(cStr)) corrIdx = 2;
      else if (['D', '4', 'OPT D'].includes(cStr)) corrIdx = 3;
      else {
        const num = parseInt(cStr, 10);
        if (!isNaN(num) && num >= 0 && num <= 3) corrIdx = num;
      }

      const expl = r.explanation || r.Explanation || r.solution || r[6] || '';
      const subj = r.subject || r.Subject || r[7] || (test?.series?.examCategory ? `${test.series.examCategory}` : 'General Studies');
      const top = r.topic || r.Topic || r[8] || '';
      const diff = r.difficulty || r.Difficulty || r[9] || 'MEDIUM';
      const m = parseFloat(r.marks || r.Marks || r[10]) || 1.0;
      const nm = parseFloat(r.negativeMarks || r.NegativeMarks || r[11]) || (test?.negativeMarking || 0.25);
      const sec = r.sectionName || r.section || bulkSectionName || 'General';

      results.push({
        questionText: String(qText).trim(),
        options: [String(op1).trim(), String(op2).trim(), String(op3 || 'Option C').trim(), String(op4 || 'Option D').trim()],
        correctAnswer: String(corrIdx),
        explanation: expl ? String(expl).trim() : null,
        subject: subj ? String(subj).trim() : 'General',
        topic: top ? String(top).trim() : null,
        difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(String(diff).toUpperCase()) ? String(diff).toUpperCase() : 'MEDIUM',
        marks: m,
        negativeMarks: nm,
        sectionName: sec,
      });
    }

    setBulkParsed(results);
  };

  const handleBulkFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.json')) {
        const text = await file.text();
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          parseRowsToQuestions(json);
        } else if (json.questions && Array.isArray(json.questions)) {
          parseRowsToQuestions(json.questions);
        } else {
          toastError('Invalid JSON format. Expected an array of questions.');
        }
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        parseRowsToQuestions(rows);
      } else {
        const text = await file.text();
        parseCSVText(text);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to parse upload file. Please check format.');
    }
  };

  const parseCSVText = (text: string) => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setBulkParsed([]);
      return;
    }

    const rows: any[] = [];
    const startIndex = lines[0].toLowerCase().includes('question') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      if (parts.length < 4) continue;

      rows.push({
        questionText: parts[0]?.replace(/^"|"$/g, '').trim(),
        optionA: parts[1]?.replace(/^"|"$/g, '').trim(),
        optionB: parts[2]?.replace(/^"|"$/g, '').trim(),
        optionC: parts[3]?.replace(/^"|"$/g, '').trim(),
        optionD: parts[4]?.replace(/^"|"$/g, '').trim(),
        correctAnswer: parts[5]?.replace(/^"|"$/g, '').trim(),
        explanation: parts[6]?.replace(/^"|"$/g, '').trim(),
        subject: parts[7]?.replace(/^"|"$/g, '').trim(),
        topic: parts[8]?.replace(/^"|"$/g, '').trim(),
        difficulty: parts[9]?.replace(/^"|"$/g, '').trim(),
        marks: parts[10]?.trim(),
        negativeMarks: parts[11]?.trim(),
      });
    }

    parseRowsToQuestions(rows);
  };

  const handleBulkSubmit = async () => {
    if (bulkParsed.length === 0) {
      toastError('No valid questions parsed to upload. Please review file content.');
      return;
    }

    try {
      setUploadingBulk(true);
      const questionsWithSection = bulkParsed.map((q) => ({
        ...q,
        sectionName: bulkSectionName || q.sectionName || 'General',
      }));

      const res = await api.questions.bulkCreate({
        questions: questionsWithSection,
        testId,
        sectionName: bulkSectionName,
      });

      if (res.success) {
        success(`Successfully uploaded ${res.count || bulkParsed.length} questions directly to this test!`);
        setIsBulkModalOpen(false);
        setBulkParsed([]);
        setBulkText('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchTestData();
      }
    } catch (err: any) {
      toastError(err.message || 'Bulk upload failed.');
    } finally {
      setUploadingBulk(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent =
      'questionText,optionA,optionB,optionC,optionD,correctOption(1-4),explanation,subject,topic,difficulty,marks,negativeMarks\n' +
      '"Who founded the Maurya Empire?","Chandragupta Maurya","Ashoka","Bindusara","Harsha",1,"Chandragupta Maurya founded the Maurya Empire in 322 BCE.","History","Ancient India","EASY",1,0.25\n' +
      '"What is the speed of light in vacuum?","3 x 10^8 m/s","3 x 10^6 m/s","3 x 10^5 km/s","None of these",1,"The speed of light in vacuum is approximately 3 x 10^8 m/s.","Science","Physics","EASY",1,0.25\n' +
      '"Which article of the Indian Constitution deals with Financial Emergency?","Article 352","Article 356","Article 360","Article 368",3,"Article 360 empowers the President to proclaim Financial Emergency.","Polity","Emergency Provisions","MEDIUM",1,0.25';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${test?.slug || 'test'}_questions_sample.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSampleJSON = () => {
    const jsonSample = [
      {
        questionText: 'Which Indian river is known as the "Dakshin Ganga"?',
        options: ['Godavari', 'Krishna', 'Cauvery', 'Narmada'],
        correctAnswer: '0',
        explanation: 'Godavari is the longest river in peninsular India and is known as Dakshin Ganga.',
        subject: 'Geography',
        topic: 'Indian Rivers',
        difficulty: 'EASY',
        marks: 1.0,
        negativeMarks: 0.25,
      },
      {
        questionText: 'Who was known as the "Iron Man of India"?',
        options: ['Jawaharlal Nehru', 'Sardar Vallabhbhai Patel', 'Subhas Chandra Bose', 'Bhagat Singh'],
        correctAnswer: '1',
        explanation: 'Sardar Vallabhbhai Patel is commemorated as the Iron Man of India for unifying 565 princely states.',
        subject: 'History',
        topic: 'Modern India',
        difficulty: 'EASY',
        marks: 1.0,
        negativeMarks: 0.25,
      },
    ];

    const blob = new Blob([JSON.stringify(jsonSample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${test?.slug || 'test'}_questions_sample.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // 3. Question Bank Import Handlers
  // -------------------------------------------------------------
  const openBankModal = async () => {
    if (!testId) return;
    setIsBankModalOpen(true);
    setSelectedBankIds([]);
    try {
      setLoadingBank(true);
      const res = await api.questions.getAvailableForTest(testId);
      if (res.success && res.questions) {
        setBankQuestions(res.questions);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch available questions from Question Bank.');
    } finally {
      setLoadingBank(false);
    }
  };

  const filteredBankQuestions = bankQuestions.filter((q) => {
    if (bankSearch.trim()) {
      const s = bankSearch.toLowerCase();
      const matchText = (q.questionText || '').toLowerCase().includes(s);
      const matchSubj = (q.subject || '').toLowerCase().includes(s);
      const matchTopic = (q.topic || '').toLowerCase().includes(s);
      if (!matchText && !matchSubj && !matchTopic) return false;
    }
    if (bankSubject && q.subject !== bankSubject) return false;
    if (bankDifficulty && q.difficulty !== bankDifficulty) return false;
    return true;
  });

  const handleToggleBankSelect = (id: string) => {
    setSelectedBankIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllBank = () => {
    if (selectedBankIds.length === filteredBankQuestions.length) {
      setSelectedBankIds([]);
    } else {
      setSelectedBankIds(filteredBankQuestions.map((q) => q.id));
    }
  };

  const handleImportBankQuestions = async () => {
    if (!testId || selectedBankIds.length === 0) {
      toastError('Please select at least one question to import.');
      return;
    }

    try {
      setImportingBank(true);
      const res = await api.questions.batchAssignToTest({
        testId,
        questionIds: selectedBankIds,
        sectionName: bankTargetSection || 'General',
      });

      if (res.success) {
        success(res.message || `Successfully attached ${selectedBankIds.length} question(s) to this test!`);
        setIsBankModalOpen(false);
        setSelectedBankIds([]);
        fetchTestData();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to import questions to test.');
    } finally {
      setImportingBank(false);
    }
  };

  // -------------------------------------------------------------
  // Unlink / Delete Handlers
  // -------------------------------------------------------------
  const handleUnlinkQuestion = async () => {
    if (!testId || !unlinkQuestionId) return;
    try {
      const res = await api.questions.removeFromTest(testId, unlinkQuestionId);
      if (res.success) {
        success('Question unlinked from this test.');
        setUnlinkQuestionId(null);
        fetchTestData();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to remove question from test.');
    }
  };

  const handleDeletePermanent = async () => {
    if (!deleteQuestionId) return;
    try {
      const res = await api.questions.delete(deleteQuestionId);
      if (res.success) {
        success('Question deleted permanently.');
        setDeleteQuestionId(null);
        fetchTestData();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to delete question.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
              <Link to="/admin/tests" className="hover:text-[#6C63FF] transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Mock Tests
              </Link>
              <span>/</span>
              <span className="text-slate-900 truncate max-w-md">{test?.title || 'Test Questions'}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <HelpCircle className="w-7 h-7 text-[#6C63FF]" />
              {test?.title || 'Manage Test Questions'}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchTestData}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh Questions List"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to={`/test-series/${test?.id}/attempt`}
              target="_blank"
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-cyan-700 hover:bg-cyan-50 text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4 text-cyan-600" />
              <span>Preview CBT Test</span>
            </Link>
          </div>
        </div>

        {/* Test Summary Banner & Stats */}
        {test && (
          <div className="bg-gradient-to-r from-purple-900 via-[#1e1b4b] to-indigo-900 text-white p-6 rounded-3xl shadow-xl shadow-indigo-500/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {test.series?.title && (
                    <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-purple-200 text-[11px] font-bold">
                      {test.series.title}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/30 text-cyan-200 text-[11px] font-bold uppercase">
                    {(test.subCategory || 'FULL_TEST').replace('_', ' ')}
                  </span>
                  {test.isFree ? (
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 text-[11px] font-black uppercase">
                      FREE TEST
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/30 text-amber-200 text-[11px] font-black uppercase">
                      PRO TEST
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black tracking-tight text-white">{test.title}</h2>
                <p className="text-xs text-purple-200 font-mono">Slug: /{test.slug}</p>
              </div>

              {/* Live Questions Counter Card */}
              <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#FF6584] flex items-center justify-center text-white shadow-md">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-200">Active Test Questions</p>
                  <p className="text-2xl font-black text-white">{questions.length} <span className="text-xs font-normal text-purple-300">Questions Added</span></p>
                </div>
              </div>
            </div>

            {/* Test Configuration Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2 text-purple-200">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Duration: <strong>{test.durationMinutes} Minutes</strong></span>
              </div>
              <div className="flex items-center gap-2 text-purple-200">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Total Marks: <strong>{test.totalMarks} Marks</strong></span>
              </div>
              <div className="flex items-center gap-2 text-purple-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Pass Marks: <strong>{test.passMarks} Marks</strong></span>
              </div>
              <div className="flex items-center gap-2 text-purple-200">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Negative Marking: <strong>-{test.negativeMarking}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Prominent Top Action Bar (Buttons: Bulk Upload, Add Question, Import from Bank) */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#6C63FF]" />
              Manage Questions Workflow (प्रश्नों का सीधा प्रबंधन)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              इस टेस्ट में सीधे नए प्रश्न जोड़ें, एक्सेल/CSV बल्क अपलोड करें, या क्वेश्चन बैंक से इंपोर्ट करें।
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Button 1: Bulk Upload Questions */}
            <button
              onClick={() => {
                setBulkParsed([]);
                setBulkText('');
                setIsBulkModalOpen(true);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Bulk Upload (Excel / CSV / JSON)</span>
            </button>

            {/* Button 2: Add Single Question */}
            <button
              onClick={openAddQuestionModal}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#6C63FF] to-[#8f88ff] hover:opacity-95 text-white font-black text-xs shadow-md shadow-[#6C63FF]/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>

            {/* Button 3: Import from Question Bank */}
            <button
              onClick={openBankModal}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-purple-50 border-2 border-purple-200 text-[#6C63FF] font-black text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span>Import from Question Bank</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Search & Filters for Questions Currently in Test */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions in this test..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 outline-none focus:border-[#6C63FF] focus:bg-white transition-colors"
              />
            </div>

            {uniqueSections.length > 0 && (
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none font-bold text-slate-700"
              >
                <option value="">All Sections ({questions.length})</option>
                {uniqueSections.map((sec) => (
                  <option key={sec} value={sec}>
                    Section: {sec}
                  </option>
                ))}
              </select>
            )}

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none font-bold text-slate-700"
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          <div className="text-xs font-bold text-slate-500">
            Showing {filteredQuestions.length} of {questions.length} questions
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Questions Table / List */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#6C63FF]" />
              <p className="text-xs font-bold text-slate-500">Loading test questions...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-20 text-center space-y-4 max-w-md mx-auto p-4">
              <div className="w-16 h-16 rounded-full bg-purple-50 text-[#6C63FF] flex items-center justify-center mx-auto">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h3 className="font-black text-slate-800 text-base">No Questions in this Test Yet</h3>
              <p className="text-xs text-slate-500">
                You can upload questions directly via Excel/CSV, add questions manually, or select and attach questions from your global Question Bank.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Upload Excel/CSV
                </button>
                <button
                  onClick={openAddQuestionModal}
                  className="px-4 py-2 rounded-xl bg-[#6C63FF] text-white font-bold text-xs hover:opacity-90 transition-colors shadow-sm"
                >
                  Add Manually
                </button>
                <button
                  onClick={openBankModal}
                  className="px-4 py-2 rounded-xl bg-purple-50 text-[#6C63FF] border border-purple-200 font-bold text-xs hover:bg-purple-100 transition-colors"
                >
                  From Question Bank
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredQuestions.map((q, idx) => {
                const correct = parseInt(q.correctAnswer, 10);

                return (
                  <div key={q.id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Index, Section, Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-[#6C63FF] text-[11px] font-black">
                          Section: {q.sectionName || 'General'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {q.subject} {q.topic ? `• ${q.topic}` : ''}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            q.difficulty === 'EASY'
                              ? 'bg-emerald-100 text-emerald-800'
                              : q.difficulty === 'HARD'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          Marks: <strong className="text-slate-800">+{q.marks || 1}</strong> | Negative: <strong className="text-rose-600">-{q.negativeMarks || 0.25}</strong>
                        </span>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => openEditQuestionModal(q)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                          title="Edit Question"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setUnlinkQuestionId(q.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition-colors"
                          title="Unlink question from this test (keeps question in Question Bank)"
                        >
                          Remove from Test
                        </button>
                        <button
                          onClick={() => setDeleteQuestionId(q.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Permanently from Database"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Text */}
                    <div className="space-y-1">
                      <p className="font-extrabold text-sm text-slate-900 leading-relaxed">
                        {q.questionText}
                      </p>
                      {q.questionHindi && q.questionHindi !== q.questionText && (
                        <p className="text-xs text-slate-600 font-medium">{q.questionHindi}</p>
                      )}
                    </div>

                    {/* 4 Options Grid */}
                    <div className="grid sm:grid-cols-2 gap-2 pt-1">
                      {Array.isArray(q.options) &&
                        q.options.map((opt, oIdx) => {
                          const isCorrect = oIdx === correct;
                          const letter = String.fromCharCode(65 + oIdx);

                          return (
                            <div
                              key={oIdx}
                              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                                isCorrect
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 ring-1 ring-emerald-400'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {letter}
                              </span>
                              <span className="truncate flex-1">{opt}</span>
                              {isCorrect && (
                                <span className="text-[10px] font-black text-emerald-700 uppercase flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                        <strong className="text-slate-800 font-bold">Explanation: </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MODAL 1: MANUAL ADD / EDIT QUESTION BOUND TO TEST_ID */}
        {/* ------------------------------------------------------------- */}
        {isQuestionModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-3xl p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6C63FF] flex items-center justify-center font-black">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">
                      {editingQuestion ? 'Edit Test Question' : 'Add Question Directly to Test'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Bound to test: <strong>{test?.title}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-4">
                {/* Section & Subject */}
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Target Section</label>
                    <input
                      type="text"
                      value={sectionName}
                      onChange={(e) => setSectionName(e.target.value)}
                      placeholder="e.g. General, Reasoning, Hindi"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. History, Mathematics, Hindi"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Topic (Optional)</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Percentage, Indus Valley"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>
                </div>

                {/* Question Text */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Question Text <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Enter the question statement..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#6C63FF] leading-relaxed"
                    required
                  />
                </div>

                {/* Optional Hindi Question Text */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">
                    Question Text in Hindi (वैकल्पिक हिंदी अनुवाद)
                  </label>
                  <textarea
                    rows={2}
                    value={questionHindi}
                    onChange={(e) => setQuestionHindi(e.target.value)}
                    placeholder="यदि आवश्यक हो तो हिंदी में प्रश्न लिखें..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>

                {/* 4 Options with Correct Answer Selector */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-800">
                      Options & Correct Answer (विकल्प चुनें)
                    </label>
                    <span className="text-[11px] text-emerald-600 font-bold">
                      Click radio to mark correct option
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isCorrect = correctIndex === idx;

                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                            isCorrect ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200 bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="correctOpt"
                            checked={isCorrect}
                            onChange={() => setCorrectIndex(idx)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                            {letter}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...options];
                              newOpts[idx] = e.target.value;
                              setOptions(newOpts);
                            }}
                            placeholder={`Option ${letter}`}
                            className="w-full px-2 py-1 text-xs outline-none bg-transparent"
                            required
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation */}
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700">Explanation / Solution (व्याख्या)</label>
                  <textarea
                    rows={2}
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Provide solution or explanation..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>

                {/* Marks, Negative Marks, Difficulty */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Positive Marks</label>
                    <input
                      type="number"
                      step="0.25"
                      value={marks}
                      onChange={(e) => setMarks(parseFloat(e.target.value) || 1.0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Negative Marks</label>
                    <input
                      type="number"
                      step="0.05"
                      value={negativeMarks}
                      onChange={(e) => setNegativeMarks(parseFloat(e.target.value) || 0.25)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#6C63FF]"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Submit bar */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsQuestionModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingQuestion}
                    className="px-6 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5b52e0] text-white text-xs font-black shadow-md shadow-[#6C63FF]/30 disabled:opacity-50 flex items-center gap-2"
                  >
                    {submittingQuestion ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingQuestion ? 'Update Question' : 'Save Question to Test'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODAL 2: BULK UPLOAD QUESTIONS (EXCEL / CSV / JSON) */}
        {/* ------------------------------------------------------------- */}
        {isBulkModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-4xl p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">
                      Bulk Upload Questions to Test
                    </h3>
                    <p className="text-xs text-slate-400">
                      Directly import questions from <strong>Excel (.xlsx, .xls)</strong>, <strong>CSV</strong>, or <strong>JSON</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadSampleCSV}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Sample CSV
                  </button>
                  <button
                    type="button"
                    onClick={downloadSampleJSON}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Sample JSON
                  </button>
                  <button
                    onClick={() => setIsBulkModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Target Section Setting */}
              <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black text-purple-900 block">Target Test Section</span>
                  <span className="text-[11px] text-purple-700">Assign all uploaded questions into this test section:</span>
                </div>
                <input
                  type="text"
                  value={bulkSectionName}
                  onChange={(e) => setBulkSectionName(e.target.value)}
                  placeholder="e.g. General, Reasoning, Hindi"
                  className="px-3.5 py-1.5 rounded-xl border border-purple-200 text-xs font-bold text-slate-800 bg-white outline-none focus:border-[#6C63FF]"
                />
              </div>

              {/* Upload Mode Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <button
                  onClick={() => setBulkMode('file')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    bulkMode === 'file'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1.5" />
                  Upload File (Excel / CSV / JSON)
                </button>
                <button
                  onClick={() => setBulkMode('text')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    bulkMode === 'text'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Paste CSV / JSON Text
                </button>
              </div>

              {bulkMode === 'file' ? (
                /* Drag & Drop File Input */
                <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-8 text-center space-y-3 bg-slate-50/50 transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Drop your Excel (.xlsx, .xls), CSV, or JSON file here
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      File will be immediately parsed and verified before uploading to the test
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.tsv,.json"
                    onChange={handleBulkFileUpload}
                    className="hidden"
                    id="bulkFileInput"
                  />
                  <label
                    htmlFor="bulkFileInput"
                    className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    Select File to Upload
                  </label>
                </div>
              ) : (
                /* Raw Text Paste */
                <div className="space-y-2">
                  <textarea
                    rows={8}
                    value={bulkText}
                    onChange={(e) => {
                      setBulkText(e.target.value);
                      parseCSVText(e.target.value);
                    }}
                    placeholder={`Paste comma-separated rows or JSON array...\nExample:\n"What is the capital of India?","Mumbai","New Delhi","Kolkata","Chennai",2,"New Delhi is capital","General Studies","Geography","EASY",1,0.25`}
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-mono text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Parsed Questions Preview Table */}
              {bulkParsed.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Parsed Preview: {bulkParsed.length} Questions Ready to Upload
                    </span>
                    <button
                      onClick={() => setBulkParsed([])}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Clear Preview
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Question Text</th>
                          <th className="py-2 px-3">Correct Option</th>
                          <th className="py-2 px-3">Subject</th>
                          <th className="py-2 px-3">Difficulty</th>
                          <th className="py-2 px-3 text-center">Marks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {bulkParsed.slice(0, 50).map((q, idx) => {
                          const corr = parseInt(q.correctAnswer, 10);
                          const letter = String.fromCharCode(65 + (isNaN(corr) ? 0 : corr));
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="py-2 px-3 font-semibold text-slate-900 max-w-xs truncate">
                                {q.questionText}
                              </td>
                              <td className="py-2 px-3 font-bold text-emerald-700">
                                {letter} ({q.options[corr] || 'Option'})
                              </td>
                              <td className="py-2 px-3">{q.subject}</td>
                              <td className="py-2 px-3">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100">
                                  {q.difficulty}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center font-mono">+{q.marks}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {bulkParsed.length > 50 && (
                    <p className="text-[11px] text-slate-400 italic">
                      + {bulkParsed.length - 50} more questions parsed and will be imported.
                    </p>
                  )}
                </div>
              )}

              {/* Submit bar */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={uploadingBulk || bulkParsed.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/30 disabled:opacity-50 flex items-center gap-2"
                >
                  {uploadingBulk ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading to Test...</span>
                    </>
                  ) : (
                    <span>Upload {bulkParsed.length > 0 ? `${bulkParsed.length} Questions` : ''} Directly to Test</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODAL 3: IMPORT FROM QUESTION BANK */}
        {/* ------------------------------------------------------------- */}
        {isBankModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-4xl p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6C63FF] flex items-center justify-center font-black">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">
                      Import from Global Question Bank
                    </h3>
                    <p className="text-xs text-slate-400">
                      Select existing questions and attach them directly to <strong>{test?.title}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBankModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Target Section Selection */}
              <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black text-purple-900">Target Section for Imported Questions:</span>
                  <span className="text-[11px] text-purple-700 block">Where should these questions be placed in this test?</span>
                </div>
                <input
                  type="text"
                  value={bankTargetSection}
                  onChange={(e) => setBankTargetSection(e.target.value)}
                  placeholder="Section (e.g. General, Reasoning, GK)"
                  className="px-3.5 py-1.5 rounded-xl border border-purple-200 text-xs font-bold text-slate-800 bg-white outline-none focus:border-[#6C63FF]"
                />
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative min-w-[200px] flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      placeholder="Search question text or topic..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#6C63FF]"
                    />
                  </div>
                  <select
                    value={bankDifficulty}
                    onChange={(e) => setBankDifficulty(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="">All Difficulties</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleToggleSelectAllBank}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  {selectedBankIds.length === filteredBankQuestions.length && filteredBankQuestions.length > 0
                    ? 'Deselect All'
                    : 'Select All Filtered'}
                </button>
              </div>

              {/* Questions List */}
              <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100">
                {loadingBank ? (
                  <div className="p-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#6C63FF] mb-2" />
                    Loading available questions from bank...
                  </div>
                ) : filteredBankQuestions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    No unattached questions found in the Question Bank matching filters.
                  </div>
                ) : (
                  filteredBankQuestions.map((q) => {
                    const isSelected = selectedBankIds.includes(q.id);
                    return (
                      <div
                        key={q.id}
                        onClick={() => handleToggleBankSelect(q.id)}
                        className={`p-3 text-xs flex items-start gap-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-purple-50/80 border-l-4 border-l-[#6C63FF]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleBankSelect(q.id)}
                          className="w-4 h-4 text-[#6C63FF] rounded focus:ring-0 mt-0.5 cursor-pointer"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                              {q.subject}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                              {q.difficulty}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">+{q.marks || 1}m</span>
                          </div>
                          <p className="font-bold text-slate-900 leading-snug">{q.questionText}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Submit bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700">
                  Selected: <strong className="text-[#6C63FF]">{selectedBankIds.length}</strong> questions
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBankModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImportBankQuestions}
                    disabled={importingBank || selectedBankIds.length === 0}
                    className="px-6 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5b52e0] text-white text-xs font-black shadow-md shadow-[#6C63FF]/30 disabled:opacity-50 flex items-center gap-2"
                  >
                    {importingBank ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Attaching...</span>
                      </>
                    ) : (
                      <span>Attach {selectedBankIds.length} Selected Questions</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CONFIRMATION MODALS */}
        {/* ------------------------------------------------------------- */}
        {/* 1. Unlink Question from Test */}
        <ConfirmModal
          isOpen={!!unlinkQuestionId}
          title="Remove Question from Test?"
          message="Are you sure you want to unlink this question from this test? The question will remain intact in the Question Bank for other tests."
          confirmText="Remove from Test"
          cancelText="Cancel"
          isDestructive={true}
          onConfirm={handleUnlinkQuestion}
          onCancel={() => setUnlinkQuestionId(null)}
        />

        {/* 2. Permanent Delete Question */}
        <ConfirmModal
          isOpen={!!deleteQuestionId}
          title="Delete Question Permanently?"
          message="This will permanently delete the question from the entire database, including the Question Bank and all attached tests. This action cannot be undone."
          confirmText="Delete Permanently"
          cancelText="Cancel"
          isDestructive={true}
          onConfirm={handleDeletePermanent}
          onCancel={() => setDeleteQuestionId(null)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminTestQuestionsPage;
