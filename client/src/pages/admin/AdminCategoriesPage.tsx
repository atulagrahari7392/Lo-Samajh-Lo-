import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, FolderTree } from 'lucide-react';
import { api } from '../../services/api';
import { Category } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';

export const AdminCategoriesPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [color, setColor] = useState('#6C63FF');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchCats = async () => {
    try {
      const data = await api.categories.getAll();
      if (data.success) setCategories(data.categories || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    try {
      if (editingId) {
        await api.categories.update(editingId, { name, slug, color, description });
        success('Category updated!');
      } else {
        await api.categories.create({ name, slug, color, description });
        success('Category created!');
      }
      setName('');
      setSlug('');
      setDescription('');
      setEditingId(null);
      await fetchCats();
    } catch (err: any) {
      toastError(err.message || 'Error saving category.');
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setColor(cat.color || '#6C63FF');
    setDescription(cat.description || '');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.categories.delete(id);
      success('Category deleted.');
      await fetchCats();
    } catch (e) {
      toastError('Could not delete category.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Exam Categories</h1>
          <p className="text-xs text-slate-500 mt-1">Organize courses and test series into exam groupings.</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Create Form */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">
              {editingId ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Category Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingId) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                  placeholder="e.g. Banking & Insurance"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. banking"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <span className="text-xs font-mono">{color}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setName('');
                      setSlug('');
                      setDescription('');
                    }}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#6C63FF] text-white text-xs font-bold shadow hover:bg-[#564ec9]"
                >
                  {editingId ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>

          {/* Categories Table */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-500">
              Existing Categories ({categories.length})
            </div>
            <div className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color || '#6C63FF' }}
                    />
                    <div>
                      <h4 className="font-bold text-slate-900">{cat.name}</h4>
                      <p className="text-[11px] text-slate-400">/{cat.slug} • {cat._count?.courses || 0} Courses</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-[#6C63FF]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCategoriesPage;
