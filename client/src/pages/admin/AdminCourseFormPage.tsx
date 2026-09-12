import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, Upload } from 'lucide-react';
import { api } from '../../services/api';
import { Category } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';

export const AdminCourseFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [instructorName, setInstructorName] = useState('Atul Agrahari');
  const [instructorBio, setInstructorBio] = useState('Senior Educator & Founder, Lo Samajh Lo');
  const [price, setPrice] = useState('999');
  const [discountedPrice, setDiscountedPrice] = useState('699');
  const [duration, setDuration] = useState('60+ Hours');
  const [status, setStatus] = useState('PUBLISHED');
  const [featured, setFeatured] = useState(false);
  const [validityDays, setValidityDays] = useState('365');

  useEffect(() => {
    // Fetch categories
    api.categories.getAll().then((data) => {
      if (data.success && data.categories) {
        setCategories(data.categories);
        if (!isEditing && data.categories.length > 0) {
          setCategoryId(data.categories[0].id);
        }
      }
    });

    // If editing, fetch course data
    if (isEditing && id) {
      setLoading(true);
      api.courses.getBySlug(id).then((data) => {
        if (data.success && data.course) {
          const c = data.course;
          setTitle(c.title);
          setSlug(c.slug);
          setShortDescription(c.shortDescription);
          setFullDescription(c.fullDescription);
          setThumbnail(c.thumbnail || '');
          setCategoryId(c.categoryId);
          setInstructorName(c.instructorName);
          setInstructorBio(c.instructorBio || '');
          setPrice(String(c.price));
          setDiscountedPrice(c.discountedPrice ? String(c.discountedPrice) : '');
          setDuration(c.duration || '60+ Hours');
          setStatus(c.status);
          setFeatured(c.featured);
          setValidityDays(String(c.validityDays));
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      // Auto generate slug
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !categoryId) {
      toastError('Title, slug, and category are required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title,
        slug,
        shortDescription,
        fullDescription,
        thumbnail: thumbnail || null,
        categoryId,
        instructorName,
        instructorBio,
        price: parseFloat(price) || 0,
        discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
        duration,
        status,
        featured,
        validityDays: parseInt(validityDays, 10) || 365,
      };

      if (isEditing && id) {
        await api.courses.update(id, payload);
        success('Course updated successfully!');
      } else {
        await api.courses.create(payload);
        success('Course created successfully and published!');
      }

      navigate('/admin/courses');
    } catch (err: any) {
      toastError(err.message || 'Failed to save course.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/admin/courses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Courses</span>
          </Link>
          <h1 className="text-xl font-black text-slate-900">
            {isEditing ? 'Edit Course Details' : 'Create New Course Batch'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">Course Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. UPSSSC PET 2026 Selection Batch"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">URL Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. upsssc-pet-2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Exam Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">Short Description (1-2 sentences)</label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief summary shown on course cards..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">Full Description / Syllabus Highlights</label>
              <textarea
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                rows={5}
                placeholder="Detailed curriculum overview, topics covered, what students will learn..."
                className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Original Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="999"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Discounted Sale Price (₹)</label>
              <input
                type="number"
                value={discountedPrice}
                onChange={(e) => setDiscountedPrice(e.target.value)}
                placeholder="699 (optional)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#6C63FF]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Instructor(s) / Faculty Team</span>
                <span className="text-[10px] text-[#6C63FF] font-semibold">Separate with commas</span>
              </label>
              <input
                type="text"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="Atul Agrahari, Dr. R.K. Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#6C63FF]"
              />
              <p className="text-[10px] text-slate-400">Add multiple teachers if the batch has more than one faculty member.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Duration (e.g. 120+ Hours)</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="120+ Hours"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#6C63FF]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Thumbnail Image URL</label>
              <input
                type="text"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#6C63FF]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Validity Duration (Days)</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Calendar Option</span>
              </label>
              <input
                type="number"
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                placeholder="365"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#6C63FF]"
              />
              <p className="text-[10px] text-slate-400">Students have access for this many days from purchase (e.g. 365 = 1 year).</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#6C63FF]"
              >
                <option value="PUBLISHED">Published (Visible on site)</option>
                <option value="DRAFT">Draft (Hidden)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-[#6C63FF]"
                />
                <span>Feature on Homepage</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
              to="/admin/courses"
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white font-bold text-xs shadow-md shadow-[#6C63FF]/30 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Course'}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminCourseFormPage;
