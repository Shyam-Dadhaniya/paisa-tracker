import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'paisatrack-theme';
const THEME_COLOR_DARK = '#080810';
const THEME_COLOR_LIGHT = '#f7f7fb';

function readStored(): ThemeMode {
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

function systemPrefersLight(): boolean {
  return window.matchMedia('(prefers-color-scheme: light)').matches;
}

/** Resolves a mode to the concrete light/dark value to render. */
function resolve(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return systemPrefersLight() ? 'light' : 'dark';
  return mode;
}

/** Applies the resolved theme to <html> and the theme-color meta tag. */
export function applyTheme(mode: ThemeMode) {
  const resolved = resolve(mode);
  const root = document.documentElement;
  root.classList.toggle('theme-light', resolved === 'light');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', resolved === 'light' ? THEME_COLOR_LIGHT : THEME_COLOR_DARK);
  }
}

interface ThemeStore {
  mode: ThemeMode;
  /** Wires up the system-preference listener and applies the current theme. */
  init: () => void;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: readStored(),

  init: () => {
    applyTheme(get().mode);
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    mq.addEventListener('change', () => {
      if (get().mode === 'system') applyTheme('system');
    });
  },

  setMode: (mode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    applyTheme(mode);
    set({ mode });
  },
}));
