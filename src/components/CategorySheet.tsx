import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowLeft, Plus } from 'lucide-react';
import { useCategoryStore, CUSTOM_COLORS } from '@/store/categoryStore';
import type { CategoryId } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  selected: CategoryId;
  onSelect: (id: CategoryId) => void;
}

export default function CategorySheet({ open, onClose, selected, onSelect }: Props) {
  const categories = useCategoryStore((s) => s.categories);
  const addCustomCategory = useCategoryStore((s) => s.addCustomCategory);

  const [view, setView] = useState<'list' | 'create'>('list');
  const [icon, setIcon] = useState('');
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(CUSTOM_COLORS[0]);
  const [saving, setSaving] = useState(false);

  // Reset form + view when sheet closes
  useEffect(() => {
    if (!open) {
      setView('list');
      setIcon('');
      setLabel('');
      setColor(CUSTOM_COLORS[0]);
      setSaving(false);
    }
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleCreate = async () => {
    if (!label.trim()) return;
    setSaving(true);
    const id = await addCustomCategory({ label: label.trim(), icon: icon || '🏷️', color });
    onSelect(id);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl max-h-[80vh] flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Content — animated between list and create views */}
            <AnimatePresence mode="wait" initial={false}>
              {view === 'list' ? (
                <motion.div
                  key="list"
                  className="flex flex-col flex-1 overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3 shrink-0">
                    <h2 className="text-base font-semibold">Category</h2>
                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg text-muted active:scale-90 transition"
                      aria-label="Close"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Grid */}
                  <div className="overflow-y-auto flex-1">
                    <div className="grid grid-cols-3 gap-px bg-border border-t border-border">
                      {categories.map((c) => {
                        const active = selected === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { onSelect(c.id); onClose(); }}
                            className={`flex flex-col items-center gap-1.5 py-3.5 transition active:scale-95 ${
                              active ? 'bg-primary/10' : 'bg-surface'
                            }`}
                          >
                            <span className="text-2xl leading-none">{c.icon}</span>
                            {active && (
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: c.color }}
                              />
                            )}
                            <span className={`text-[11px] font-medium leading-none ${active ? 'text-primary' : 'text-muted'}`}>
                              {c.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Create button */}
                    <button
                      type="button"
                      onClick={() => setView('create')}
                      className="w-full flex items-center justify-center gap-2 py-4 text-sm text-primary font-medium border-t border-border active:opacity-70 transition"
                    >
                      <Plus size={15} />
                      New category
                    </button>
                    <div className="h-6" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="create"
                  className="flex flex-col flex-1 overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 px-4 py-3 shrink-0">
                    <button
                      onClick={() => setView('list')}
                      className="p-1.5 rounded-lg text-muted active:scale-90 transition"
                      aria-label="Back"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-base font-semibold">New category</h2>
                  </div>

                  {/* Form */}
                  <div className="overflow-y-auto flex-1 px-5 space-y-5 pb-6">
                    {/* Emoji picker */}
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <div className="w-20 h-20 rounded-2xl bg-surface2 border border-border flex items-center justify-center">
                        <span className="text-4xl">{icon || '🏷️'}</span>
                      </div>
                      <input
                        value={icon}
                        onChange={(e) => setIcon(e.target.value.slice(-2))}
                        placeholder="Tap to pick emoji"
                        maxLength={2}
                        className="text-center text-sm text-muted bg-transparent focus:outline-none placeholder:text-muted/60 w-36"
                        autoComplete="off"
                      />
                    </div>

                    {/* Name input */}
                    <div>
                      <label className="text-xs text-muted uppercase tracking-wider mb-2 block">
                        Name
                      </label>
                      <input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Category name"
                        className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                        autoComplete="off"
                      />
                    </div>

                    {/* Color picker */}
                    <div>
                      <label className="text-xs text-muted uppercase tracking-wider mb-3 block">
                        Color
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {CUSTOM_COLORS.map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => setColor(hex)}
                            className={`w-8 h-8 rounded-full transition active:scale-90 ${
                              color === hex ? 'ring-2 ring-white ring-offset-2 ring-offset-surface scale-110' : ''
                            }`}
                            style={{ backgroundColor: hex }}
                            aria-label={hex}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Create button */}
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={!label.trim() || saving}
                      className="w-full bg-primary text-white font-semibold py-3.5 rounded-2xl active:scale-[0.98] transition disabled:opacity-50"
                    >
                      {saving ? 'Creating…' : 'Create category'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
