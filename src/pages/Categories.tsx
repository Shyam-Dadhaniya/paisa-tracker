import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { useCategoryStore, CUSTOM_COLORS } from '@/store/categoryStore';

export default function Categories() {
  const navigate = useNavigate();
  const categories = useCategoryStore((s) => s.categories);
  const addCustomCategory = useCategoryStore((s) => s.addCustomCategory);
  const deleteCustomCategory = useCategoryStore((s) => s.deleteCustomCategory);

  const customCategories = categories.filter((c) => c.id.startsWith('custom_'));

  const [showForm, setShowForm] = useState(false);
  const [newIcon, setNewIcon] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(CUSTOM_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    const label = newLabel.trim();
    if (!label) return;
    setSaving(true);
    await addCustomCategory({ label, icon: newIcon.trim() || '🏷️', color: newColor });
    setNewIcon('');
    setNewLabel('');
    setNewColor(CUSTOM_COLORS[0]);
    setShowForm(false);
    setSaving(false);
  };

  return (
    <main className="safe-top safe-bottom max-w-md mx-auto px-4">
      <header className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-muted active:scale-95"
          aria-label="Back"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Custom Categories</h1>
      </header>

      {customCategories.length === 0 && !showForm && (
        <p className="text-center text-muted mt-12 mb-6">No custom categories yet.</p>
      )}

      {customCategories.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border/60 divide-y divide-border/40 mb-4">
          {customCategories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: c.color + '33' }}
              >
                {c.icon}
              </div>
              <span className="flex-1 font-medium">{c.label}</span>
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: c.color }}
              />
              <button
                onClick={() => deleteCustomCategory(c.id)}
                className="p-1.5 text-muted hover:text-danger transition active:scale-95"
                aria-label={`Delete ${c.label}`}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="bg-surface rounded-2xl border border-border/60 p-4 space-y-4">
          <div className="flex gap-2">
            <input
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              placeholder="🏷️"
              maxLength={2}
              className="w-14 text-center text-2xl bg-surface2 border border-border rounded-xl py-2.5 focus:outline-none focus:border-primary"
            />
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Category name"
              autoFocus
              className="flex-1 bg-surface2 border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2.5 flex-wrap">
            {CUSTOM_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setNewColor(color)}
                className={`w-8 h-8 rounded-full transition active:scale-95 ${
                  newColor === color ? 'ring-2 ring-offset-2 ring-offset-surface ring-primary' : ''
                }`}
                style={{ backgroundColor: color }}
                aria-label={color}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-border text-muted text-sm active:scale-95 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !newLabel.trim()}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 active:scale-95 transition"
            >
              {saving ? 'Adding…' : 'Add'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center gap-2 bg-surface rounded-2xl px-4 py-3.5 border border-border/60 text-primary active:scale-[0.99] transition"
        >
          <Plus size={18} />
          <span className="font-medium">Add category</span>
        </button>
      )}
    </main>
  );
}
