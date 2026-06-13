import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Plus, List, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/history', label: 'History', icon: List },
  { to: '/add', label: 'Add', icon: Plus, primary: true },
  { to: '/sms', label: 'Scan', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const haptic = useHaptics();

  if (pathname === '/add' || pathname.startsWith('/edit/')) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40">
      <div className="glass border-t shadow-elevated">
        <ul className="flex justify-around items-center h-16 max-w-md mx-auto">
          {items.map(({ to, label, icon: Icon, primary }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={to === '/'}
                onClick={() => haptic(primary ? 'medium' : 'light')}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-1 h-full transition-colors ${
                    isActive ? 'text-primary' : 'text-muted'
                  }`
                }
              >
                {({ isActive }) =>
                  primary ? (
                    <motion.span
                      whileTap={{ scale: 0.88 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                      className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-gradient text-white shadow-soft -mt-4"
                    >
                      <Icon size={26} strokeWidth={2.5} />
                    </motion.span>
                  ) : (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute top-1.5 w-1.5 h-1.5 rounded-full bg-primary"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                      <Icon size={22} />
                      <span className="text-[10px] font-medium">{label}</span>
                    </>
                  )
                }
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-surface" style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  );
}
