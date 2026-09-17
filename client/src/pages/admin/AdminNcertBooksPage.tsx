import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  X,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  Filter,
  Layers,
  Globe,
  AlertTriangle,
  Check,
  Download,
} from 'lucide-react';
import { api } from '../../services/api';
import { NcertBook } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { NcertReaderModal } from '../../components/ncert/NcertReaderModal';

export const AdminNcertBooksPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [books, setBooks] = useState<NcertBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedMedium, setSelectedMedium] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Preview Reader
  const [previewBook, setPreviewBook] = useState<NcertBook | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Form Fields
  const [classNumber, setClassNumber] = useState<number>(10);
  const [subject, setSubject] = useState('Science');
  const [bookName, setBookName] = useState('');
  const [bookNameHi, setBookNameHi] = useState('');
  const [medium, setMedium] = useState('English');
  const [language, setLanguage] = useState('English');
  const [edition, setEdition] = useState('Rationalised Edition 2025-26');
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [bookCode, setBookCode] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [officialPageUrl, setOfficialPageUrl] = useState('https://ncert.nic.in/textbook.php');
  const [officialPdfUrl, setOfficialPdfUrl] = useState('');
  const [chapterCount, setChapterCount] = useState<number>(10);
  const [chaptersJson, setChaptersJson] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Fetch books
  const fetchBooks = () => {
    setLoading(true);
    const params: Record<string, any> = {
      page: pagination.page,
      limit: 20,
    };
    if (selectedClass !== 'ALL') params.classNumber = selectedClass;
    if (selectedMedium !== 'ALL') params.medium = selectedMedium;
    if (selectedStatus !== 'ALL') params.status = selectedStatus;
    if (search.trim()) params.search = search.trim();

    api.ncert
      .adminGetAll(params)
      .then((res) => {
        if (res.success) {
          setBooks(res.data || []);
          if (res.pagination) setPagination(res.pagination);
        }
      })
      .catch((err) => {
        toastError(err.message || 'Failed to load NCERT books');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBooks();
  }, [pagination.page, selectedClass, selectedMedium, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks();
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setClassNumber(10);
    setSubject('Science');
    setBookName('');
    setBookNameHi('');
    setMedium('English');
    setLanguage('English');
    setEdition('Rationalised Edition 2025-26');
    setAcademicYear('2025-26');
    setBookCode('');
    setCoverImageUrl('');
    setOfficialPageUrl('https://ncert.nic.in/textbook.php');
    setOfficialPdfUrl('');
    setChapterCount(10);
    setChaptersJson('');
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (book: NcertBook) => {
    setEditingId(book.id);
    setClassNumber(book.classNumber);
    setSubject(book.subject);
    setBookName(book.bookName);
    setBookNameHi(book.bookNameHi || '');
    setMedium(book.medium);
    setLanguage(book.language);
    setEdition(book.edition || 'Rationalised Edition 2025-26');
    setAcademicYear(book.academicYear || '2025-26');
    setBookCode(book.bookCode || '');
    setCoverImageUrl(book.coverImageUrl || '');
    setOfficialPageUrl(book.officialPageUrl || 'https://ncert.nic.in/textbook.php');
    setOfficialPdfUrl(book.officialPdfUrl);
    setChapterCount(book.chapterCount || 0);
    setChaptersJson(book.chaptersJson || (book.chapters ? JSON.stringify(book.chapters, null, 2) : ''));
    setIsActive(book.isActive);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let parsedChapters: any = null;
    if (chaptersJson.trim()) {
      try {
        parsedChapters = JSON.parse(chaptersJson);
      } catch (err) {
        toastError('Invalid chapters JSON format. Please verify syntax.');
        setSubmitting(false);
        return;
      }
    }

    const payload: any = {
      classNumber,
      subject,
      bookName,
      bookNameHi: bookNameHi || null,
      medium,
      language,
      edition,
      academicYear,
      bookCode: bookCode || null,
      coverImageUrl: coverImageUrl || null,
      officialPageUrl,
      officialPdfUrl,
      chapterCount,
      chapters: parsedChapters,
      isActive,
    };

    try {
      if (editingId) {
        await api.ncert.update(editingId, payload);
        toastSuccess('NCERT book updated successfully');
      } else {
        await api.ncert.create(payload);
        toastSuccess('NCERT book catalogue entry created');
      }
      setIsFormOpen(false);
      fetchBooks();
    } catch (err: any) {
      toastError(err.message || 'Failed to save book');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (book: NcertBook) => {
    try {
      await api.ncert.toggleStatus(book.id, !book.isActive);
      toastSuccess(`Book ${!book.isActive ? 'activated' : 'deactivated'}`);
      fetchBooks();
    } catch (err: any) {
      toastError(err.message || 'Failed to update status');
    }
  };

  const handleVerifySource = async (book: NcertBook) => {
    try {
      const res = await api.ncert.verifySource(book.id);
      if (res.success) {
        toastSuccess(res.message || 'Source verified successfully');
        fetchBooks();
      }
    } catch (err: any) {
      toastError(err.message || 'Verification failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.ncert.delete(deleteId);
      toastSuccess('NCERT book removed from catalogue (storage unaffected)');
      setDeleteId(null);
      fetchBooks();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete catalogue entry');
    }
  };

  const handleSeedOfficialCatalog = async () => {
    setSyncing(true);
    try {
      const res = await api.ncert.seedOfficial();
      toastSuccess(res.message || 'Official NCERT catalog synced successfully');
      fetchBooks();
    } catch (err: any) {
      toastError(err.message || 'Failed to seed catalog');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                <BookOpen className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black text-slate-900">NCERT Official Books Library</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage authoritative NCERT textbooks catalog (Classes 1–12). Links directly to official NCERT portal with zero local PDF duplication.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Sync Official Catalog Button */}
            <button
              onClick={handleSeedOfficialCatalog}
              disabled={syncing}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
              title="Populate/Refresh standard official NCERT catalog across Classes 1-12"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Official Catalog'}</span>
            </button>

            {/* Add Book Button */}
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#6C63FF]/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add NCERT Book</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase block">Total Books</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{pagination.total}</span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase block">Classes Covered</span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">1 to 12</span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase block">Authoritative Source</span>
            <span className="text-base font-bold text-emerald-600 mt-1 block flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> ncert.nic.in
            </span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase block">Storage Isolation</span>
            <span className="text-xs font-bold text-purple-700 mt-1 block">
              100% Isolated (0 Drive Uploads)
            </span>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, subject, NCERT code, or class..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Classes (1-12)</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </select>

            {/* Medium Filter */}
            <select
              value={selectedMedium}
              onChange={(e) => setSelectedMedium(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Mediums</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Urdu">Urdu</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <button
              type="button"
              onClick={fetchBooks}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Books Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase">
                <tr>
                  <th className="px-4 py-3">Book & Details</th>
                  <th className="px-4 py-3">Class & Subject</th>
                  <th className="px-4 py-3">Medium & Code</th>
                  <th className="px-4 py-3">Official NCERT URL</th>
                  <th className="px-4 py-3">Source Verified</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading NCERT catalogue...
                    </td>
                  </tr>
                ) : books.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      No NCERT books found. Click "Sync Official Catalog" or "Add NCERT Book" above.
                    </td>
                  </tr>
                ) : (
                  books.map((book) => (
                    <tr key={book.id} className="hover:bg-slate-50/80 transition">
                      {/* Book & Details */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-center p-1">
                            {book.coverImageUrl ? (
                              <img
                                src={book.coverImageUrl}
                                alt={book.bookName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : null}
                            <BookOpen className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{book.bookName}</span>
                            {book.bookNameHi && (
                              <span className="text-[11px] text-slate-500 block">{book.bookNameHi}</span>
                            )}
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              {book.chapterCount} Chapters • {book.edition || '2025-26'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Class & Subject */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 block w-max mb-1">
                          Class {book.classNumber}
                        </span>
                        <span className="font-bold text-slate-800">{book.subject}</span>
                      </td>

                      {/* Medium & Code */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-700 block">{book.medium}</span>
                        {book.bookCode && (
                          <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                            Code: {book.bookCode}
                          </span>
                        )}
                      </td>

                      {/* Official NCERT URL */}
                      <td className="px-4 py-3 max-w-xs truncate">
                        <a
                          href={book.officialPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-[11px] truncate"
                          title={book.officialPdfUrl}
                        >
                          <span className="truncate">{book.officialPdfUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>

                      {/* Source Verified */}
                      <td className="px-4 py-3">
                        {book.sourceVerifiedAt ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-semibold">Unchecked</span>
                        )}
                        <button
                          onClick={() => handleVerifySource(book)}
                          className="block text-[10px] text-blue-600 hover:underline mt-1 font-semibold"
                        >
                          Re-verify now
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(book)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition ${
                            book.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {book.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview Reader */}
                          <button
                            onClick={() => {
                              setPreviewBook(book);
                              setIsPreviewOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition"
                            title="Preview Reader"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(book)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#6C63FF]/10 text-slate-600 hover:text-[#6C63FF] transition"
                            title="Edit Metadata"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteId(book.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition"
                            title="Delete Catalogue Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Modal (Add / Edit) */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>{editingId ? 'Edit NCERT Book' : 'Add Official NCERT Book'}</span>
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Class */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Class (1 to 12) *
                    </label>
                    <select
                      value={classNumber}
                      onChange={(e) => setClassNumber(parseInt(e.target.value, 10))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
                        <option key={c} value={c}>
                          Class {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Subject *</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Science, Mathematics, Physics"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Book Name */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Book Name *</label>
                    <input
                      type="text"
                      value={bookName}
                      onChange={(e) => setBookName(e.target.value)}
                      placeholder="e.g. Science, Beehive, Joyful Mathematics"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>

                  {/* Book Name (Hindi) */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Book Name (Hindi / Script)
                    </label>
                    <input
                      type="text"
                      value={bookNameHi}
                      onChange={(e) => setBookNameHi(e.target.value)}
                      placeholder="e.g. विज्ञान, गणित प्रकाश"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Medium */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Medium *</label>
                    <select
                      value={medium}
                      onChange={(e) => setMedium(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Urdu">Urdu</option>
                    </select>
                  </div>

                  {/* NCERT Book Code */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">NCERT Book Code</label>
                    <input
                      type="text"
                      value={bookCode}
                      onChange={(e) => setBookCode(e.target.value)}
                      placeholder="e.g. jesc1, jemh1, leph1"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Chapter Count */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Chapter Count</label>
                    <input
                      type="number"
                      value={chapterCount}
                      onChange={(e) => setChapterCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Official PDF URL */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Official NCERT PDF URL * (Must point to ncert.nic.in)
                  </label>
                  <input
                    type="url"
                    value={officialPdfUrl}
                    onChange={(e) => setOfficialPdfUrl(e.target.value)}
                    placeholder="https://ncert.nic.in/textbook.php?jesc1=0-13"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Important: LoSamajhLo opens the official textbook link directly. Do not paste third-party scrapers or Drive links.
                  </span>
                </div>

                {/* Cover Image URL */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Cover Image URL (e.g. ncert.nic.in/textbook/pdf/...cc.jpg)
                  </label>
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://ncert.nic.in/textbook/pdf/jesc1cc.jpg"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Chapters JSON */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Chapters Breakdown (JSON Format)
                  </label>
                  <textarea
                    rows={4}
                    value={chaptersJson}
                    onChange={(e) => setChaptersJson(e.target.value)}
                    placeholder='[ { "chapterNumber": 1, "title": "Chemical Reactions", "pdfUrl": "https://ncert.nic.in/textbook.php?jesc1=1-13" } ]'
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Book is Active & Visible to Students
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingId ? 'Update Book' : 'Add Book'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteId}
          title="Delete NCERT Book from Catalogue"
          message="Are you sure you want to remove this book from the NCERT discovery catalogue? This action deletes ONLY the catalog record in PostgreSQL. No Google Drive, FileAsset, or Study Material files will ever be touched or deleted."
          confirmText="Yes, Delete Record"
          cancelText="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          isDestructive={true}
        />

        {/* Reader Preview Modal */}
        <NcertReaderModal
          book={previewBook}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminNcertBooksPage;
