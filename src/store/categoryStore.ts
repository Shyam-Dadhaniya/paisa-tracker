import { create } from 'zustand';
import { db } from '@/services/db';
import { CATEGORIES } from '@/utils/categories';
import type { Category, CustomCategory } from '@/types';

export const CUSTOM_COLORS = [
  '#F59E0B', '#3B82F6', '#EC4899', '#10B981',
  '#8B5CF6', '#EF4444', '#6B7280', '#F97316',
];

function toCategory(c: CustomCategory): Category {
  return { id: c.id, label: c.label, icon: c.icon, color: c.color };
}

async function reloadCategories(): Promise<Category[]> {
  const custom = await db.customCategories.orderBy('createdAt').toArray();
  return [...CATEGORIES, ...custom.map(toCategory)];
}

interface CategoryStore {
  categories: Category[];
  loadCustomCategories: () => Promise<void>;
  addCustomCategory: (data: { label: string; icon: string; color: string }) => Promise<string>;
  deleteCustomCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: CATEGORIES,

  loadCustomCategories: async () => {
    set({ categories: await reloadCategories() });
  },

  addCustomCategory: async ({ label, icon, color }) => {
    const entry: CustomCategory = {
      id: 'custom_' + crypto.randomUUID(),
      label,
      icon,
      color,
      createdAt: Date.now(),
    };
    await db.customCategories.add(entry);
    set({ categories: await reloadCategories() });
    return entry.id;
  },

  deleteCustomCategory: async (id) => {
    await db.customCategories.delete(id);
    set({ categories: await reloadCategories() });
  },
}));

export function findCategory(id: string): Category {
  const cats = useCategoryStore.getState().categories;
  return cats.find((c) => c.id === id) ?? cats.find((c) => c.id === 'other')!;
}
