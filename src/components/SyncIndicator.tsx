import { Cloud, CloudOff, RefreshCw, AlertTriangle, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSync } from '@/hooks/useSync';
import { formatDistanceToNow } from 'date-fns';

export default function SyncIndicator() {
  const { status, lastSyncedAt, error, syncNow } = useSync();

  if (status === 'signed-out') {
    return (
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-xs text-muted bg-surface border border-border rounded-full px-2.5 py-1"
      >
        <LogIn size={12} /> Sign in to sync
      </Link>
    );
  }

  const map = {
    syncing: { icon: <RefreshCw size={12} className="animate-spin" />, label: 'Syncing…', cls: 'text-primary' },
    synced: {
      icon: <Cloud size={12} />,
      label: lastSyncedAt ? `Synced ${formatDistanceToNow(lastSyncedAt, { addSuffix: true })}` : 'Synced',
      cls: 'text-success',
    },
    offline: { icon: <CloudOff size={12} />, label: 'Offline', cls: 'text-muted' },
    error: { icon: <AlertTriangle size={12} />, label: error ?? 'Sync error', cls: 'text-danger' },
    idle: { icon: <Cloud size={12} />, label: '—', cls: 'text-muted' },
  }[status];

  return (
    <button
      onClick={syncNow}
      className={`inline-flex items-center gap-1.5 text-xs bg-surface border border-border rounded-full px-2.5 py-1 ${map.cls}`}
    >
      {map.icon}
      {map.label}
    </button>
  );
}
