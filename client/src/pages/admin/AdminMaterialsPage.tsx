import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Download,
  Trash2,
  Edit2,
  ExternalLink,
  CheckCircle,
  X,
  RefreshCw,
  FolderTree,
  Eye,
  Layers,
  Sparkles,
  BookOpen,
  Archive,
  Copy,
  Check,
  Upload,
  Calendar,
  Filter,
  BarChart3,
  Bookmark,
  ChevronRight,
  TrendingUp,
  Globe,
} from 'lucide-react';
import { api } from '../../services/api';
import { Material, Category, CurrentAffairs, StudyTaxonomy, MaterialStats, FileLibraryItem } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { PdfReaderModal } from '../../components/materials/PdfReaderModal';

export const AdminMaterialsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  // Navigation tab: 'dashboard' | 'materials' | 'add' | 'taxonomies' | 'files' | 'current-affairs'
  const [adminTab, setAdminTab] = useState<'dashboard' | 'materials' | 'add' | 'taxonomies' | 'files' | 'current-affairs'>('dashboard');

  // Common state
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MaterialStats | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // Filters for Materials table
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Preview Reader Modal
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Delete Confirm Modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkActionType, setBulkActionType] = useState<string | null>(null);

  // Form State for Add / Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [materialType, setMaterialType] = useState('CLASS_NOTES');
  const [classGrade, setClassGrade] = useState('Class 10 (Board)');
  const [subject, setSubject] = useState('Science');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [examName, setExamName] = useState('Competitive Exams');
  const [year, setYear] = useState<string>('2026');
  const [shift, setShift] = useState('');
  const [language, setLanguage] = useState('BILINGUAL');
  const [pageCount, setPageCount] = useState<number>(15);
  const [fileUrl, setFileUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [fileType, setFileType] = useState('PDF');
  const [fileSize, setFileSize] = useState('3.5 MB');
  const [author, setAuthor] = useState('Lo Samajh Lo Faculty');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [isFree, setIsFree] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [status, setStatus] = useState('PUBLISHED');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  // Taxonomy Tab State
  const [taxonomies, setTaxonomies] = useState<StudyTaxonomy[]>([]);
  const [taxType, setTaxType] = useState('CATEGORY');
  const [taxName, setTaxName] = useState('');
  const [taxSlug, setTaxSlug] = useState('');

  // File Library Tab State
  const [fileLibrary, setFileLibrary] = useState<FileLibraryItem[]>([]);
  const [fileSearch, setFileSearch] = useState('');
  const [copiedFileUrl, setCopiedFileUrl] = useState<string | null>(null);

  // Current Affairs Tab State
  const [currentAffairsList, setCurrentAffairsList] = useState<CurrentAffairs[]>([]);
  const [caTitle, setCaTitle] = useState('');
  const [caCategory, setCaCategory] = useState('NATIONAL');
  const [caDate, setCaDate] = useState(new Date().toISOString().split('T')[0]);
  const [caContent, setCaContent] = useState('');
  const [caSource, setCaSource] = useState('PIB');
  const [caPdfUrl, setCaPdfUrl] = useState('');
  const [caSubmitting, setCaSubmitting] = useState(false);

  // Fetch Dashboard stats
  const fetchStats = async () => {
    try {
      const res = await api.materials.getAdminStats();
      if (res.success) setStats(res.stats);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Materials List
  const fetchMaterials = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedType !== 'ALL') params.materialType = selectedType;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;

      const res = await api.materials.adminGetAll(params);
      if (res.success) {
        setMaterials(res.materials || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await api.categories.getAll();
      if (res.success) {
        setCategories(res.categories || []);
        if (res.categories?.length > 0 && !categoryId) {
          setCategoryId(res.categories[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Taxonomies
  const fetchTaxonomies = async () => {
    try {
      const res = await api.materials.getTaxonomies();
      if (res.success) setTaxonomies(res.taxonomies || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch File Library
  const fetchFileLibrary = async () => {
    try {
      const res = await api.materials.getFileLibrary();
      if (res.success) setFileLibrary(res.files || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Current Affairs
  const fetchCurrentAffairs = async () => {
    try {
      const res = await api.currentAffairs.adminGetAll();
      if (res.success) setCurrentAffairsList(res.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCategories();
    fetchMaterials(1);
  }, []);

  useEffect(() => {
    if (adminTab === 'materials') fetchMaterials(1);
    else if (adminTab === 'dashboard') fetchStats();
    else if (adminTab === 'taxonomies') fetchTaxonomies();
    else if (adminTab === 'files') fetchFileLibrary();
    else if (adminTab === 'current-affairs') fetchCurrentAffairs();
  }, [adminTab]);

  // Handle PDF file upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPdf(true);
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setFileUrl(data.fileUrl);
        setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
        toastSuccess('PDF uploaded successfully!');
      } else {
        toastError(data.message || 'Upload failed');
      }
    } catch (err: any) {
      toastError(err.message || 'PDF upload failed');
    } finally {
      setUploadingPdf(false);
    }
  };

  // Handle Thumbnail upload
  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingThumb(true);
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setThumbnail(data.fileUrl);
        toastSuccess('Thumbnail uploaded successfully!');
      } else {
        toastError(data.message || 'Upload failed');
      }
    } catch (err: any) {
      toastError(err.message || 'Thumbnail upload failed');
    } finally {
      setUploadingThumb(false);
    }
  };

  // Reset Add/Edit Form
  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setFullContent('');
    setMaterialType('CLASS_NOTES');
    setClassGrade('Class 10 (Board)');
    setSubject('Science');
    setChapter('');
    setTopic('');
    setExamName('Competitive Exams');
    setYear('2026');
    setShift('');
    setLanguage('BILINGUAL');
    setPageCount(15);
    setFileUrl('');
    setThumbnail('');
    setFileType('PDF');
    setFileSize('3.5 MB');
    setAuthor('Lo Samajh Lo Faculty');
    setDifficulty('MEDIUM');
    setIsFree(true);
    setIsFeatured(false);
    setIsTrending(false);
    setStatus('PUBLISHED');
    setMetaTitle('');
    setMetaDescription('');
    setKeywords('');
    if (categories.length > 0) setCategoryId(categories[0].id);
  };

  // Open Edit Mode
  const openEdit = (mat: Material) => {
    setEditingId(mat.id);
    setTitle(mat.title);
    setSlug(mat.slug || '');
    setDescription(mat.description || '');
    setFullContent(mat.fullContent || '');
    setCategoryId(mat.categoryId);
    setMaterialType(mat.materialType || 'CLASS_NOTES');
    setClassGrade(mat.classGrade || 'Class 10 (Board)');
    setSubject(mat.subject);
    setChapter(mat.chapter || '');
    setTopic(mat.topic || '');
    setExamName(mat.examName);
    setYear(mat.year ? String(mat.year) : '2026');
    setShift(mat.shift || '');
    setLanguage(mat.language || 'BILINGUAL');
    setPageCount(mat.pageCount || 15);
    setFileUrl(mat.fileUrl);
    setThumbnail(mat.thumbnail || '');
    setFileType(mat.fileType || 'PDF');
    setFileSize(mat.fileSize || '3.5 MB');
    setAuthor(mat.author || 'Lo Samajh Lo Faculty');
    setDifficulty(mat.difficulty || 'MEDIUM');
    setIsFree(mat.isFree);
    setIsFeatured(!!mat.isFeatured);
    setIsTrending(!!mat.isTrending);
    setStatus(mat.status);
    setMetaTitle(mat.metaTitle || '');
    setMetaDescription(mat.metaDescription || '');
    setKeywords(mat.keywords || '');
    setAdminTab('add');
  };

  // Duplicate Material
  const handleDuplicate = async (mat: Material) => {
    try {
      const payload = {
        ...mat,
        title: `${mat.title} (Copy)`,
        slug: undefined,
        status: 'DRAFT',
      };
      delete (payload as any).id;
      delete (payload as any).createdAt;
      delete (payload as any).updatedAt;
      delete (payload as any).category;
      delete (payload as any).downloadsCount;
      delete (payload as any).viewsCount;

      const res = await api.materials.create(payload);
      if (res.success) {
        toastSuccess('Material duplicated as Draft!');
        fetchMaterials(1);
        fetchStats();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to duplicate');
    }
  };

  // Save Material (Create or Update)
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId || !fileUrl.trim()) {
      toastError('Title, Category, and File URL/Upload are required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || null,
        fullContent: fullContent.trim() || null,
        categoryId,
        materialType,
        classGrade: classGrade.trim() || null,
        subject: subject.trim() || 'General',
        chapter: chapter.trim() || null,
        topic: topic.trim() || null,
        examName: examName.trim() || 'Competitive Exams',
        year: year ? parseInt(year, 10) : null,
        shift: shift.trim() || null,
        language,
        pageCount,
        fileUrl: fileUrl.trim(),
        thumbnail: thumbnail.trim() || null,
        fileType,
        fileSize,
        author: author.trim() || null,
        difficulty,
        isFree,
        isFeatured,
        isTrending,
        status,
        metaTitle: metaTitle.trim() || null,
        metaDescription: metaDescription.trim() || null,
        keywords: keywords.trim() || null,
      };

      if (editingId) {
        const res = await api.materials.update(editingId, payload);
        if (res.success) {
          toastSuccess('Study material updated successfully!');
          resetForm();
          setAdminTab('materials');
          fetchMaterials(pagination.page);
          fetchStats();
        }
      } else {
        const res = await api.materials.create(payload);
        if (res.success) {
          toastSuccess('Study material created successfully!');
          resetForm();
          setAdminTab('materials');
          fetchMaterials(1);
          fetchStats();
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to save material');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Single Material
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await api.materials.delete(deleteId);
      if (res.success) {
        toastSuccess('Material deleted successfully');
        fetchMaterials(pagination.page);
        fetchStats();
      }
    } catch (err: any) {
      toastError(err.message || 'Delete failed');
    } finally {
      setDeleteId(null);
    }
  };

  // Bulk Action Execution
  const executeBulkAction = async (action: string) => {
    if (selectedIds.length === 0) {
      toastError('Please select at least one material.');
      return;
    }

    try {
      const res = await api.materials.bulkAction(action, selectedIds);
      if (res.success) {
        toastSuccess(res.message || 'Bulk action completed');
        setSelectedIds([]);
        fetchMaterials(pagination.page);
        fetchStats();
      }
    } catch (err: any) {
      toastError(err.message || 'Bulk action failed');
    }
  };

  // Save Taxonomy
  const handleSaveTaxonomy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxName.trim()) return;

    try {
      const res = await api.materials.saveTaxonomy({
        type: taxType,
        name: taxName.trim(),
        slug: taxSlug.trim() || undefined,
      });
      if (res.success) {
        toastSuccess('Taxonomy item saved!');
        setTaxName('');
        setTaxSlug('');
        fetchTaxonomies();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to save taxonomy');
    }
  };

  // Delete Taxonomy
  const handleDeleteTaxonomy = async (id: string) => {
    try {
      await api.materials.deleteTaxonomy(id);
      toastSuccess('Taxonomy removed');
      fetchTaxonomies();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete');
    }
  };

  // Save Current Affairs
  const handleSaveCurrentAffairs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caTitle.trim() || !caContent.trim()) {
      toastError('Title and content are required.');
      return;
    }

    try {
      setCaSubmitting(true);
      const res = await api.currentAffairs.create({
        title: caTitle.trim(),
        category: caCategory,
        date: caDate,
        content: caContent.trim(),
        source: caSource.trim() || null,
        pdfUrl: caPdfUrl.trim() || null,
      });
      if (res.success) {
        toastSuccess('Current Affairs article published!');
        setCaTitle('');
        setCaContent('');
        setCaPdfUrl('');
        fetchCurrentAffairs();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to save current affairs');
    } finally {
      setCaSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { id: 'dashboard', label: 'Dashboard Overview', icon: BarChart3 },
              { id: 'materials', label: 'All Materials Table', icon: FileText, count: pagination.total },
              { id: 'add', label: editingId ? 'Edit Material' : 'Add New Material', icon: Plus },
              { id: 'taxonomies', label: 'Categories & Taxonomies', icon: FolderTree },
              { id: 'files', label: 'File / Media Library', icon: Archive },
              { id: 'current-affairs', label: 'Current Affairs Workflow', icon: Sparkles },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = adminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setAdminTab(tab.id as any);
                    if (tab.id === 'add' && !editingId) resetForm();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
                    isActive
                      ? 'bg-[#6C63FF] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-extrabold">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                fetchStats();
                fetchMaterials(pagination.page);
                toastSuccess('Data refreshed');
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: DASHBOARD OVERVIEW (Phase 14) */}
        {/* ---------------------------------------------------- */}
        {adminTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">कुल सामग्री / Total</span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalMaterials}</p>
                <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1">
                  <span className="text-emerald-600 font-bold">{stats.publishedMaterials} Live</span>
                  <span>•</span>
                  <span className="text-amber-600 font-bold">{stats.draftMaterials} Drafts</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">कुल डाउनलोड्स / Downloads</span>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.totalDownloads.toLocaleString()}</p>
                <div className="text-[11px] text-slate-500 pt-1">
                  आज: <strong className="text-slate-800">{stats.todayDownloads}</strong> • इस माह: <strong className="text-slate-800">{stats.monthDownloads}</strong>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">कुल व्यूज / Total Views</span>
                <p className="text-2xl sm:text-3xl font-black text-blue-600">{stats.totalViews.toLocaleString()}</p>
                <div className="text-[11px] text-slate-500 pt-1">
                  पाठकों द्वारा पढ़े गए दस्तावेज़
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">निःशुल्क बनाम प्रीमियम</span>
                <div className="flex items-center gap-3 pt-1">
                  <div>
                    <span className="text-xs font-bold text-emerald-700">Free:</span>
                    <span className="text-lg font-black ml-1 text-slate-900">{stats.freeMaterials}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-purple-700">Paid:</span>
                    <span className="text-lg font-black ml-1 text-slate-900">{stats.premiumMaterials}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 pt-1">
                  {stats.archivedMaterials} सामग्री संग्रहित (Archived)
                </div>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-lg font-black">नई अध्ययन सामग्री या ई-बुक जोड़ें</h3>
                <p className="text-xs text-slate-300">
                  सीधे अपने कंप्यूटर/लोकल ड्राइव से पीडीएफ अपलोड करें और शैक्षणिक विवरण भरें।
                </p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setAdminTab('add');
                }}
                className="px-6 py-3 rounded-2xl bg-[#6C63FF] hover:bg-[#5b52f5] text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>नया मटेरियल जोड़ें / Add Material</span>
              </button>
            </div>

            {/* Recent Uploads Table */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">हाल ही में जोड़ी गई सामग्री (Recent Additions)</h3>
                <button
                  onClick={() => setAdminTab('materials')}
                  className="text-xs font-bold text-[#6C63FF] hover:underline"
                >
                  सभी देखें / View All Table →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-400 font-extrabold uppercase border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">शीर्षक / Title</th>
                      <th className="py-3 px-4">प्रकार / Type</th>
                      <th className="py-3 px-4">विषय / Subject</th>
                      <th className="py-3 px-4">डाउनलोड्स</th>
                      <th className="py-3 px-4">स्थिति / Status</th>
                      <th className="py-3 px-4 text-right">कार्रवाई / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {materials.slice(0, 5).map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                          {m.title}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {m.materialType || 'NOTES'}
                          </span>
                        </td>
                        <td className="py-3 px-4">{m.subject}</td>
                        <td className="py-3 px-4 font-bold text-emerald-600">{m.downloadsCount || 0}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openEdit(m)}
                            className="px-2.5 py-1 rounded-lg bg-[#6C63FF]/10 text-[#6C63FF] font-bold text-[11px] hover:bg-[#6C63FF] hover:text-white transition"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: ALL MATERIALS MANAGEMENT TABLE (Phase 16) */}
        {/* ---------------------------------------------------- */}
        {adminTab === 'materials' && (
          <div className="space-y-4">
            {/* Search and Filters Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Search */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs w-full md:w-64">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') fetchMaterials(1); }}
                    placeholder="खोजें (Title, Subject, Exam)..."
                    className="w-full bg-transparent outline-none text-slate-800"
                  />
                  {search && (
                    <button onClick={() => { setSearch(''); fetchMaterials(1); }}>
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 outline-none"
                >
                  <option value="">सभी श्रेणियाँ / All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {/* Material Type Filter */}
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 outline-none"
                >
                  <option value="ALL">सभी प्रकार / All Types</option>
                  <option value="NCERT">NCERT</option>
                  <option value="CLASS_NOTES">Class Notes</option>
                  <option value="E_BOOK">E-Book</option>
                  <option value="PYQ">PYQ Papers</option>
                  <option value="PRACTICE_SET">Practice Sets</option>
                  <option value="QUESTION_BANK">Question Banks</option>
                  <option value="SHORT_NOTES">Short Notes</option>
                  <option value="ONE_LINER">One Liners</option>
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 outline-none"
                >
                  <option value="ALL">सभी स्थिति / All Status</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>

                <button
                  onClick={() => fetchMaterials(1)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                >
                  फ़िल्टर लागू करें
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    resetForm();
                    setAdminTab('add');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#6C63FF] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                  <span>नया जोड़ें</span>
                </button>
              </div>
            </div>

            {/* Bulk Selection Bar (Phase 16) */}
            {selectedIds.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
                <span className="font-bold text-indigo-900">
                  {selectedIds.length} सामग्री चयनित (Selected)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => executeBulkAction('publish')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                  >
                    Bulk Publish
                  </button>
                  <button
                    onClick={() => executeBulkAction('unpublish')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 transition"
                  >
                    Move to Draft
                  </button>
                  <button
                    onClick={() => executeBulkAction('archive')}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-800 transition"
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => executeBulkAction('delete')}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
                  >
                    Bulk Delete
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="p-1 text-slate-400 hover:text-slate-600"
                    title="Deselect all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Table Area */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={materials.length > 0 && selectedIds.length === materials.length}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds(materials.map(m => m.id));
                            else setSelectedIds([]);
                          }}
                          className="rounded border-slate-300"
                        />
                      </th>
                      <th className="py-3.5 px-4 min-w-[240px]">शीर्षक / Title</th>
                      <th className="py-3.5 px-4">प्रकार / Type</th>
                      <th className="py-3.5 px-4">कक्षा / Class</th>
                      <th className="py-3.5 px-4">विषय / Subject</th>
                      <th className="py-3.5 px-4">परीक्षा / Exam</th>
                      <th className="py-3.5 px-4">डाउनलोड / व्यूज</th>
                      <th className="py-3.5 px-4">स्थिति / Status</th>
                      <th className="py-3.5 px-4 text-right">कार्रवाई / Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                          लोड हो रहा है... / Loading study materials...
                        </td>
                      </tr>
                    ) : materials.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                          कोई सामग्री नहीं मिली / No study materials found
                        </td>
                      </tr>
                    ) : (
                      materials.map(m => {
                        const isChecked = selectedIds.includes(m.id);
                        return (
                          <tr key={m.id} className={`hover:bg-slate-50/60 transition ${isChecked ? 'bg-indigo-50/40' : ''}`}>
                            <td className="py-3.5 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) setSelectedIds(prev => prev.filter(id => id !== m.id));
                                  else setSelectedIds(prev => [...prev, m.id]);
                                }}
                                className="rounded border-slate-300"
                              />
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 leading-snug line-clamp-2">
                                {m.title}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                                <span>{m.fileSize}</span>
                                <span>•</span>
                                <span>{m.language}</span>
                                {m.slug && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono text-[10px] text-indigo-500 truncate max-w-[120px]">
                                      /{m.slug}
                                    </span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                                {m.materialType?.replace('_', ' ') || 'NOTES'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-700">
                              {m.classGrade || '—'}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              {m.subject}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-600">
                              {m.examName}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-emerald-600 flex items-center gap-1">
                                <Download className="w-3 h-3" />
                                {m.downloadsCount || 0}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                👁️ {m.viewsCount || 0} views
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                m.status === 'PUBLISHED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : m.status === 'DRAFT'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {m.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                              {/* Preview Reader */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewMaterial(m);
                                  setIsPreviewOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                title="Preview PDF"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Duplicate */}
                              <button
                                type="button"
                                onClick={() => handleDuplicate(m)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                                title="Duplicate Material"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => openEdit(m)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#6C63FF] hover:bg-slate-100 transition"
                                title="Edit Material"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => setDeleteId(m.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span>
                    कुल {pagination.total} में से पृष्ठ {pagination.page} / {pagination.totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => fetchMaterials(pagination.page - 1)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-bold disabled:opacity-40"
                    >
                      पिछला
                    </button>
                    <button
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchMaterials(pagination.page + 1)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-bold disabled:opacity-40"
                    >
                      अगला
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: ADD / EDIT MATERIAL FORM (Phase 15) */}
        {/* ---------------------------------------------------- */}
        {adminTab === 'add' && (
          <form onSubmit={handleSaveMaterial} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {editingId ? 'अध्ययन सामग्री संपादित करें / Edit Study Material' : 'नई अध्ययन सामग्री जोड़ें / Add New Material'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  शीर्षक, शैक्षणिक विवरण, फाइल अपलोड और एसईओ सेटिंग्स भरें।
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setAdminTab('materials');
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                रद्द करें / Cancel
              </button>
            </div>

            {/* Section 1: Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#6C63FF]" />
                <span>1. सामान्य जानकारी / Basic Information</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">सामग्री का शीर्षक / Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. NCERT Class 7 Science: Chapter 1 - Nutrition in Plants Notes PDF"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#6C63FF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">URL स्लग / Slug (SEO-friendly)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="स्वचालित बनेगा यदि खाली छोड़ें (auto-generated)"
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#6C63FF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">मुख्य श्रेणी / Main Category *</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#6C63FF]"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">सामग्री का प्रकार / Material Type *</label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#6C63FF]"
                  >
                    <option value="NCERT">NCERT Textbook & Solution</option>
                    <option value="CLASS_NOTES">Handwritten Class Notes</option>
                    <option value="E_BOOK">E-Book & Reference Guide</option>
                    <option value="PYQ">Previous Year Paper (PYQ)</option>
                    <option value="PRACTICE_SET">Practice Set</option>
                    <option value="QUESTION_BANK">Question Bank (1000+ MCQs)</option>
                    <option value="SHORT_NOTES">Short Notes & Mind Maps</option>
                    <option value="ONE_LINER">One Liners</option>
                    <option value="WORKSHEET">Worksheet</option>
                    <option value="OTHER">Other Resource</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">लेखक / संस्था / Author</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. Atul Agrahari / Lo Samajh Lo Faculty"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">संक्षिप्त विवरण / Short Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="इस अध्ययन सामग्री का 2-3 पंक्तियों में संक्षिप्त विवरण..."
                    className="w-full text-xs font-normal bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Academic Metadata */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>2. शैक्षणिक विवरण / Academic Metadata</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">कक्षा / Class Grade</label>
                  <input
                    type="text"
                    value={classGrade}
                    onChange={(e) => setClassGrade(e.target.value)}
                    placeholder="e.g. Class 7, Class 10 (Board), Graduation"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">विषय / Subject *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Science, Mathematics, History, Polity"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">लक्षित परीक्षा / Target Exam</label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="e.g. UPSSSC PET, SSC CGL, Railway NTPC"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">अध्याय / Chapter Name</label>
                  <input
                    type="text"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    placeholder="e.g. Chapter 1: Nutrition in Plants"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">टॉपिक / Topic</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Photosynthesis & Stomata"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">माध्यम / Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                  >
                    <option value="HINDI">हिन्दी (Hindi)</option>
                    <option value="ENGLISH">English</option>
                    <option value="BILINGUAL">द्विभाषी (Bilingual)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">वर्ष / Year (फॉर PYQ)</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2026"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">पाली / Shift (फॉर PYQ)</label>
                  <input
                    type="text"
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    placeholder="e.g. Shift 1, Shift 2"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">कठिनाई स्तर / Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                  >
                    <option value="EASY">सरल (Easy)</option>
                    <option value="MEDIUM">मध्यम (Medium)</option>
                    <option value="HARD">कठिन (Hard)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: File & Access */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>3. फ़ाइल एवं एक्सेस / File Upload & Permissions</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PDF Upload / URL */}
                <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800">PDF / दस्तावेज़ फ़ाइल *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="/uploads/... या सीधा लिंक"
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl p-2.5 outline-none"
                    />
                    <label className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shrink-0 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingPdf ? 'अपलोड...' : 'Browse'}</span>
                      <input type="file" accept=".pdf,.doc,.docx" onChange={handlePdfUpload} className="hidden" />
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400">सीधे कंप्यूटर से PDF चुनें या URL दर्ज करें।</p>
                </div>

                {/* Thumbnail / Cover Upload */}
                <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800">कवर इमेज / Thumbnail</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={thumbnail}
                      onChange={(e) => setThumbnail(e.target.value)}
                      placeholder="/uploads/... या इमेज लिंक"
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl p-2.5 outline-none"
                    />
                    <label className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shrink-0 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingThumb ? 'अपलोड...' : 'Browse'}</span>
                      <input type="file" accept="image/*" onChange={handleThumbUpload} className="hidden" />
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400">पुस्तक या नोट्स का कवर फोटो (वैकल्पिक)।</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">फ़ाइल साइज़ / Size</label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="e.g. 3.5 MB"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">कुल पृष्ठ / Page Count</label>
                  <input
                    type="number"
                    value={pageCount}
                    onChange={(e) => setPageCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                  />
                </div>

                {/* Toggles */}
                <div className="md:col-span-2 flex flex-wrap items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={isFree}
                      onChange={(e) => setIsFree(e.target.checked)}
                      className="w-4 h-4 text-[#6C63FF] rounded border-slate-300"
                    />
                    <span>100% निःशुल्क (Free Material)</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 text-[#6C63FF] rounded border-slate-300"
                    />
                    <span>Featured (होम व लाइब्रेरी हाइलाइट)</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={isTrending}
                      onChange={(e) => setIsTrending(e.target.checked)}
                      className="w-4 h-4 text-[#6C63FF] rounded border-slate-300"
                    />
                    <span>Trending (ट्रेंडिंग लिस्टिंग)</span>
                  </label>

                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs font-bold text-slate-700">प्रकाशन स्थिति:</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-1.5"
                    >
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: SEO Metadata */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-600" />
                <span>4. सर्च इंजन ऑप्टिमाइजेशन / SEO & Discoverability</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">मेटा शीर्षक / Meta Title</label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Google सर्च के लिए अनुकूल शीर्षक"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">कीवर्ड्स / Keywords (Comma separated)</label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="ncert notes, class 7 science, pyq pet 2025"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">विस्तृत अध्याय सारांश / Full Chapter Content (Optional)</label>
                  <textarea
                    rows={4}
                    value={fullContent}
                    onChange={(e) => setFullContent(e.target.value)}
                    placeholder="अध्याय के मुख्य बिंदु, थ्योरम या सारांश जो डिटेल पेज पर दिखाई देंगे..."
                    className="w-full text-xs font-normal bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setAdminTab('materials');
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                रद्द करें
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md hover:opacity-95 disabled:opacity-50"
              >
                {submitting ? 'सहेज रहे हैं...' : editingId ? 'अपडेट करें / Save Changes' : 'प्रकाशित करें / Publish Material'}
              </button>
            </div>
          </form>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: CATEGORIES & TAXONOMIES MANAGER (Phase 17) */}
        {/* ---------------------------------------------------- */}
        {adminTab === 'taxonomies' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Taxonomy Form */}
            <form onSubmit={handleSaveTaxonomy} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#6C63FF]" />
                <span>नया टैक्सोनॉमी आइटम जोड़ें</span>
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">प्रकार / Taxonomy Type</label>
                <select
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                >
                  <option value="CATEGORY">Category (श्रेणी)</option>
                  <option value="CLASS">Class / Grade (कक्षा)</option>
                  <option value="SUBJECT">Subject (विषय)</option>
                  <option value="EXAM">Target Exam (लक्षित परीक्षा)</option>
                  <option value="TOPIC">Topic (टॉपिक)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">नाम / Name *</label>
                <input
                  type="text"
                  required
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  placeholder="e.g. Science & Tech (विज्ञान)"
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">स्लग / Slug (वैकल्पिक)</label>
                <input
                  type="text"
                  value={taxSlug}
                  onChange={(e) => setTaxSlug(e.target.value)}
                  placeholder="auto-generated if blank"
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#6C63FF] text-white font-bold text-xs shadow-sm hover:opacity-90 transition"
              >
                + टैक्सोनॉमी सेव करें
              </button>
            </form>

            {/* Existing Taxonomies List */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900">
                  वर्तमान टैक्सोनॉमी सूची ({taxonomies.length})
                </h3>
                <span className="text-xs text-slate-400">Dynamic categories & filters</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {taxonomies.map(t => (
                  <div
                    key={t.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold mr-2">
                        {t.type}
                      </span>
                      <strong className="text-slate-900">{t.name}</strong>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">/{t.slug}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteTaxonomy(t.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 5: REUSABLE FILE / MEDIA LIBRARY (Phase 18) */}
        {/* ---------------------------------------------------- */}
        {adminTab === 'files' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  placeholder="फ़ाइल नाम से खोजें..."
                  className="w-full bg-transparent outline-none"
                />
              </div>

              {/* Upload directly to library */}
              <label className="px-4 py-2 rounded-xl bg-[#6C63FF] hover:bg-indigo-600 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>नया दस्तावेज़/इमेज अपलोड करें</span>
                <input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    const token = localStorage.getItem('token');
                    const res = await fetch('/api/upload', {
                      method: 'POST',
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                      body: formData,
                    });
                    const d = await res.json();
                    if (d.success) {
                      toastSuccess('Uploaded to File Library!');
                      fetchFileLibrary();
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Files Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {fileLibrary
                .filter(f => !fileSearch || f.filename.toLowerCase().includes(fileSearch.toLowerCase()))
                .map(file => {
                  const isCopied = copiedFileUrl === file.url;
                  return (
                    <div
                      key={file.filename}
                      className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {file.ext}
                          </span>
                          <span className="text-slate-400 text-[11px] font-medium">{file.size}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 break-all line-clamp-2" title={file.filename}>
                          {file.filename}
                        </h4>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#6C63FF] font-bold hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>देखें</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(file.url);
                            setCopiedFileUrl(file.url);
                            setTimeout(() => setCopiedFileUrl(null), 2000);
                            toastSuccess('URL copied to clipboard');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'Copied' : 'Copy URL'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 6: CURRENT AFFAIRS ADMIN WORKFLOW (Phase 19) */}
        {/* ---------------------------------------------------- */}
        {adminTab === 'current-affairs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Article Form */}
            <form onSubmit={handleSaveCurrentAffairs} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#6C63FF]" />
                <span>नया करेंट अफेयर्स लेख प्रकाशित करें</span>
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">दिनांक / Date *</label>
                <input
                  type="date"
                  required
                  value={caDate}
                  onChange={(e) => setCaDate(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">श्रेणी / Category</label>
                <select
                  value={caCategory}
                  onChange={(e) => setCaCategory(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                >
                  <option value="NATIONAL">National (राष्ट्रीय)</option>
                  <option value="INTERNATIONAL">International (अंतर्राष्ट्रीय)</option>
                  <option value="ECONOMY">Economy (अर्थव्यवस्था)</option>
                  <option value="SCIENCE_TECH">Science & Tech (विज्ञान)</option>
                  <option value="SPORTS">Sports (खेलकूद)</option>
                  <option value="AWARDS">Awards (पुरस्कार)</option>
                  <option value="SCHEMES">Govt Schemes (योजनाएं)</option>
                  <option value="DEFENCE">Defence (रक्षा)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">शीर्षक / Headline *</label>
                <input
                  type="text"
                  required
                  value={caTitle}
                  onChange={(e) => setCaTitle(e.target.value)}
                  placeholder="मुख्य समाचार या घटना का शीर्षक..."
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">विवरण / Full Article *</label>
                <textarea
                  rows={5}
                  required
                  value={caContent}
                  onChange={(e) => setCaContent(e.target.value)}
                  placeholder="लेख के मुख्य बिंदु और परीक्षा उपयोगी विश्लेषण..."
                  className="w-full text-xs font-normal bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">स्रोत / Source</label>
                <input
                  type="text"
                  value={caSource}
                  onChange={(e) => setCaSource(e.target.value)}
                  placeholder="e.g. PIB / The Hindu / PTI"
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">मासिक PDF लिंक (Optional)</label>
                <input
                  type="text"
                  value={caPdfUrl}
                  onChange={(e) => setCaPdfUrl(e.target.value)}
                  placeholder="/uploads/... या सीधा PDF लिंक"
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={caSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-indigo-600 text-white font-bold text-xs shadow-md disabled:opacity-50"
              >
                {caSubmitting ? 'प्रकाशित कर रहे हैं...' : 'प्रकाशित करें / Publish Article'}
              </button>
            </form>

            {/* Current Affairs Published List */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900">
                  प्रकाशित समसामयिकी लेख ({currentAffairsList.length})
                </h3>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {currentAffairsList.map(item => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                        {item.category}
                      </span>
                      <span className="text-slate-400 font-medium">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {item.content}
                    </p>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">स्रोत: {item.source || 'PIB'}</span>
                      <button
                        onClick={async () => {
                          await api.currentAffairs.delete(item.id);
                          toastSuccess('Article deleted');
                          fetchCurrentAffairs();
                        }}
                        className="text-rose-600 font-bold hover:underline"
                      >
                        हटाएं / Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* In-Browser PDF Reader Preview Modal */}
      <PdfReaderModal
        material={previewMaterial}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="सामग्री हटाएं / Delete Study Material"
        message="क्या आप वाकई इस अध्ययन सामग्री को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।"
        confirmText="हाँ, हटाएं (Delete)"
        cancelText="रद्द करें (Cancel)"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AdminLayout>
  );
};

export default AdminMaterialsPage;
