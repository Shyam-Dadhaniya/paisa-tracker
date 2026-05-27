import type { Category, CategoryId } from '@/types';

export const CATEGORIES: Category[] = [
  { id: 'food', label: 'Food', icon: '🍔', color: '#F59E0B' },
  { id: 'transport', label: 'Transport', icon: '🚗', color: '#3B82F6' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: '#EC4899' },
  { id: 'bills', label: 'Bills', icon: '🧾', color: '#10B981' },
  { id: 'entertainment', label: 'Fun', icon: '🎬', color: '#8B5CF6' },
  { id: 'health', label: 'Health', icon: '🩺', color: '#EF4444' },
  { id: 'other', label: 'Other', icon: '📦', color: '#6B7280' },
];

export const categoryMap: Record<CategoryId, Category> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.id]: c }),
  {} as Record<CategoryId, Category>,
);

export function getCategory(id: CategoryId): Category {
  return categoryMap[id] ?? categoryMap.other;
}
