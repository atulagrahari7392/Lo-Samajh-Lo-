import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Image, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Category } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';

export const AdminCourseFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

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
    // 1. Fetch categories
    api.categories.getAll().then((data) => {
      if (data.success && data.categories) {
        setCategories(data.categories);
        if (!isEditing && data.categories.length > 0 && !categoryId) {
          setCategoryId(data.categories[0].id);
        }
      }
    });

    // 2. If editing, fetch existing course data
    if (isEditing && id) {
      setLoading(true);
      api.courses.getBySlug(id)
        .then((data) => {
          if (data.success && data.course) {
            const c = data.course;
            setCourseId(c.id);
            setTitle(c.title);
            setSlug(c.slug);
            setShortDescription(c.shortDescription || '');
            setFullDescription(c.fullDescription || '');
            setThumbnail(c.thumbnail || '');
            setCategoryId(c.categoryId);
            setInstructorName(c.instructorName || 'Atul Agrahari');
            setInstructorBio(c.instructorBio || '');
            setPrice(c.price !== undefined && c.price !== null ? String(c.price) : '0');
            setDiscountedPrice(c.discountedPrice !== undefined && c.discountedPrice !== null ? String(c.discountedPrice) : '');
            setDuration(c.duration || '60+ Hours');
            setStatus(c.status || 'PUBLISHED');
            setFeatured(Boolean(c.featured));
            setValidityDays(c.validityDays ? String(c.validityDays) : '365');
          } else {
            toastError('Could not load course details.');
          }
        })
        .catch((err: any) => {
          toastError(err.message || 'Failed to fetch course details.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      // Auto generate slug from title for new course
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  // Local Computer File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (e.g. 15MB)
    if (file.size > 15 * 1024 * 1024) {
      toastError('Image size should be less than 15MB.');
      return;
    }

    try {
      setUploadingFile(true);
      const res = await api.upload.file(file, { category: 'COURSES', entityType: 'COURSE' });
      if (res.success && res.fileUrl) {
        setThumbnail(res.fileUrl);
        const providerName = res.storageProvider === 'GOOGLE_DRIVE' ? 'Google Drive' : 'Storage';
        success(`Thumbnail image uploaded successfully to ${providerName}!`);
      } else {
        toastError('Failed to upload thumbnail image.');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to upload image from computer.');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !categoryId) {
      toastError('Title, URL slug, and exam category are required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        shortDescription: shortDescription.trim(),
        fullDescription: fullDescription.trim(),
        thumbnail: thumbnail.trim() || null,
        categoryId,
        instructorName: instructorName.trim() || 'Atul Agrahari',
        instructorBio: instructorBio.trim() || '',
        price: parseFloat(price) || 0,
        discountedPrice: discountedPrice.trim() ? parseFloat(discountedPrice) : null,
        duration: duration.trim() || '60+ Hours',
        status,
        featured,
        validityDays: parseInt(validityDays, 10) || 365,
      };

      const targetId = courseId || id;

      if (isEditing && targetId) {
        await api.courses.update(targetId, payload);
        success('Course updated successfully!');
      } else {
        await api.courses.create(payload);
        success('Course created successfully and published!');
      }

      navigate('/admin/courses');
    } catch (err: any) {
      toastError(err.message || 'Failed to save course changes.');
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
            {isEditing ? 'Edit Course Details / कोर्स संपादित करें' : 'Create New Course Batch / नया कोर्स बनाएं'}
          </h1>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#6C63FF]" />
            <p className="text-xs font-bold text-slate-500">Loading course information...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Course Title / कोर्स का नाम</label>
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
                <label className="text-xs font-bold text-slate-700">URL Slug / लिंक पहचान</label>
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
                <label className="text-xs font-bold text-slate-700">Exam Category / परीक्षा श्रेणी</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                  required
                >
                  <option value="">Select Category</option>
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
                  min="0"
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
                  placeholder="699 (optional, leave empty if none)"
                  min="0"
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

              {/* Course Thumbnail with Direct Computer Upload Button */}
              <div className="sm:col-span-2 space-y-3 pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Image className="w-4 h-4 text-[#6C63FF]" />
                      <span>Course Thumbnail / कोर्स थंबनेल</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Upload directly from your computer drive or paste an image URL.
                    </p>
                  </div>

                  {/* Direct File Upload Button */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6C63FF] to-indigo-600 hover:from-[#584feb] hover:to-indigo-500 text-white font-bold text-xs shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {uploadingFile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading from computer...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>कंप्यूटर से फोटो चुनें (Upload from PC)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Preview Box & URL Input */}
                <div className="grid sm:grid-cols-3 gap-4 items-start bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                  {/* Image Preview Box */}
                  <div className="sm:col-span-1">
                    {thumbnail ? (
                      <div className="space-y-2">
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white aspect-video max-h-36 shadow-sm group">
                          <img
                            src={thumbnail}
                            alt="Course Thumbnail"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500';
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Image Loaded
                          </span>
                          <button
                            type="button"
                            onClick={() => setThumbnail('')}
                            className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-[#6C63FF] rounded-xl p-4 flex flex-col items-center justify-center text-center aspect-video max-h-36 bg-white hover:bg-indigo-50/30 transition-all cursor-pointer"
                      >
                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-[11px] font-bold text-slate-600">Click to upload photo</span>
                        <span className="text-[10px] text-slate-400">PNG, JPG, WEBP</span>
                      </div>
                    )}
                  </div>

                  {/* Manual URL Input */}
                  <div className="sm:col-span-2 space-y-1.5 self-center">
                    <label className="text-[11px] font-bold text-slate-600">
                      Or Image URL (Uploaded path or online link)
                    </label>
                    <input
                      type="text"
                      value={thumbnail}
                      onChange={(e) => setThumbnail(e.target.value)}
                      placeholder="/uploads/... or https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                    />
                    <p className="text-[10px] text-slate-400">
                      When you click "कंप्यूटर से फोटो चुनें", your chosen file is automatically uploaded and its URL is populated here.
                    </p>
                  </div>
                </div>
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
                  min="1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                />
                <p className="text-[10px] text-slate-400">Students have access for this many days from purchase (e.g. 365 = 1 year).</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Status / स्थिति</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                >
                  <option value="PUBLISHED">Published (Visible to all students)</option>
                  <option value="DRAFT">Draft (Hidden from students)</option>
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
                  <span>Feature on Homepage / होमपेज पर दिखाएं</span>
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
                disabled={submitting || uploadingFile}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white font-bold text-xs shadow-md shadow-[#6C63FF]/30 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditing ? 'Save Changes / बदलाव सुरक्षित करें' : 'Create Course / नया कोर्स बनाएं'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCourseFormPage;
