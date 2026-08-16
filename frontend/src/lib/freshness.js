/**
 * Calculates freshness status based on lastUpdated timestamp.
 * - < 2 hours: Fresh (Green)
 * - 2 - 6 hours: Stale (Yellow/Amber)
 * - > 6 hours: Outdated/Expired (Gray)
 */
export function getFreshnessStatus(lastUpdated) {
  if (!lastUpdated) {
    return {
      status: 'expired',
      label: '⏳ Outdated (>6h)',
      text: 'Last updated unknown',
      colorClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
      badgeVariant: 'outline',
      isStale: true,
      isExpired: true
    };
  }

  const updatedDate = new Date(lastUpdated);
  const now = new Date();
  const diffMs = now.getTime() - updatedDate.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  const diffHours = (diffMs / (1000 * 60 * 60)).toFixed(1);

  if (diffMinutes < 120) {
    const timeLabel = diffMinutes < 1 ? 'Just now' : `${diffMinutes}m ago`;
    return {
      status: 'fresh',
      label: '🟢 Live & Fresh',
      text: `Updated ${timeLabel}`,
      colorClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-medium',
      badgeVariant: 'outline',
      isStale: false,
      isExpired: false
    };
  } else if (diffMinutes < 360) {
    return {
      status: 'stale',
      label: '⚠️ Stale Data',
      text: `Updated ${diffHours}h ago`,
      colorClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-medium',
      badgeVariant: 'outline',
      isStale: true,
      isExpired: false
    };
  } else {
    return {
      status: 'expired',
      label: '⏳ Outdated (>6h)',
      text: `Updated ${Math.floor(diffHours)}h ago`,
      colorClass: 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/30 opacity-75',
      badgeVariant: 'outline',
      isStale: true,
      isExpired: true
    };
  }
}
