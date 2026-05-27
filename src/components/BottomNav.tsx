import { NavLink } from 'react-router-dom';
import { Home, Plus, List, Settings as SettingsIcon, Sparkles } from 'lucide-react';

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/history', label: 'History', icon: List },
  { to: '/add', label: 'Add', icon: Plus, primary: true },
  { to: '/sms', label: 'Scan', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex justify-around items-center h-16 max-w-md mx-auto">
        {items.map(({ to, label, icon: Icon, primary }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 h-full transition-colors ${
                  isActive ? 'text-primary' : 'text-muted'
                }`
              }
            >
              {primary ? (
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white shadow-lg shadow-primary/30 -mt-4">
                  <Icon size={26} strokeWidth={2.5} />
                </span>
              ) : (
                <>
                  <Icon size={22} />
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
