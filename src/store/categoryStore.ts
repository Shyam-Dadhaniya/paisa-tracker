import { create } from 'zustand';
import { db } from '@/services/db';
import { triggerSync } from './triggerSync';
import { CATEGORIES } from '@/utils/categories';
import { uuid } from '@/utils/uuid';
import type { Category, CustomCategory } from '@/types';

export const CUSTOM_COLORS = [
  '#F59E0B', '#3B82F6', '#EC4899', '#10B981',
  '#8B5CF6', '#EF4444', '#6B7280', '#F97316',
];

function toCategory(c: CustomCategory): Category {
  return { id: c.id, label: c.label, icon: c.icon, color: c.color };
}

async function reloadCategories(): Promise<Category[]> {
  const custom = await db.customCategories
    .orderBy('createdAt')
    .filter((c) => !c.deleted)
    .toArray();
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
    const now = Date.now();
    const entry: CustomCategory = {
      id: 'custom_' + uuid(),
      label,
      icon,
      color,
      createdAt: now,
      updatedAt: now,
    };
    await db.customCategories.add(entry);
    set({ categories: await reloadCategories() });
    triggerSync();
    return entry.id;
  },

  deleteCustomCategory: async (id) => {
    // Soft-delete so the tombstone propagates to the cloud and other devices.
    await db.customCategories.update(id, { deleted: true, updatedAt: Date.now() });
    set({ categories: await reloadCategories() });
    triggerSync();
  },
}));

export function findCategory(id: string): Category {
  const cats = useCategoryStore.getState().categories;
  return cats.find((c) => c.id === id) ?? cats.find((c) => c.id === 'other')!;
}
