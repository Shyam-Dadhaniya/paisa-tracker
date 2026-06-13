import { Cloud, CloudOff, RefreshCw, AlertTriangle, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSync } from '@/hooks/useSync';

/** Compact "time ago" — e.g. "just now", "5m", "2h", "3d", "2w". */
function shortAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

const PILL = 'inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 shrink-0 whitespace-nowrap border';

export default function SyncIndicator() {
  const { status, lastSyncedAt, error, syncNow } = useSync();

  if (status === 'signed-out') {
    return (
      <Link to="/login" className={`${PILL} text-muted bg-surface border-border`}>
        <LogIn size={12} /> Sign in to sync
      </Link>
    );
  }

  const map = {
    syncing: {
      icon: <RefreshCw size={12} className="animate-spin" />,
      label: 'Syncing…',
      cls: 'text-primary bg-primary/10 border-primary/20',
    },
    synced: {
      icon: <Cloud size={12} />,
      label: lastSyncedAt ? `Synced ${shortAgo(lastSyncedAt)}` : 'Synced',
      cls: 'text-success bg-success/10 border-success/20',
    },
    offline: {
      icon: <CloudOff size={12} />,
      label: 'Offline',
      cls: 'text-muted bg-surface border-border',
    },
    error: {
      icon: <AlertTriangle size={12} />,
      label: error ?? 'Sync error',
      cls: 'text-danger bg-danger/10 border-danger/20',
    },
    idle: {
      icon: <Cloud size={12} />,
      label: '—',
      cls: 'text-muted bg-surface border-border',
    },
  }[status];

  return (
    <button onClick={syncNow} title={map.label} className={`${PILL} ${map.cls}`}>
      {map.icon}
      <span className="truncate max-w-[8.5rem]">{map.label}</span>
    </button>
  );
}
