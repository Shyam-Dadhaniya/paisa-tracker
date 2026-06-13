export const PRIMARY_COLOR = '#6366F1';
export const PRIMARY_RGB: [number, number, number] = [99, 102, 241];
export const BACKGROUND_COLOR = '#080810';

/** CSS-variable-backed theme colors, resolved at call time so charts/SVGs
 *  (which can't use Tailwind classes) stay in sync with the active theme. */
export function getThemeColors() {
  const read = (name: string, fallback: string) => {
    if (typeof window === 'undefined') return fallback;
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v ? `rgb(${v.split(/\s+/).join(' ')})` : fallback;
  };
  return {
    primary: read('--c-primary', '#6366F1'),
    gradFrom: read('--grad-from', '#6366F1'),
    gradVia: read('--grad-via', '#A855F7'),
    gradTo: read('--grad-to', '#EC4899'),
    surface: read('--c-surface', '#13131C'),
    surface2: read('--c-surface2', '#1C1C28'),
    border: read('--c-border', '#262635'),
    text: read('--c-text', '#F5F5FA'),
    muted: read('--c-muted', '#8A8A9B'),
    success: read('--c-success', '#10B981'),
    danger: read('--c-danger', '#EF4444'),
  };
}
