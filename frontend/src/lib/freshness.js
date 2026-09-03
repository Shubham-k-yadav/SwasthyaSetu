export function formatFreshness(timestamp) {
  if (!timestamp) return 'Recently updated';
  const now = new Date();
  const date = new Date(timestamp);
  const diffMinutes = Math.floor((now - date) / (1000 * 60));
  if (diffMinutes < 1) return 'Updated just now';
  if (diffMinutes < 60) return `Updated ${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Updated ${diffHours} hr ago`;
  return `Updated on ${date.toLocaleDateString()}`;
}

export function getFreshnessBadgeColor(timestamp) {
  if (!timestamp) return 'bg-emerald-100 text-emerald-700';
  const diffMinutes = Math.floor((new Date() - new Date(timestamp)) / (1000 * 60));
  if (diffMinutes < 15) return 'bg-emerald-100 text-emerald-700';
  if (diffMinutes < 60) return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}

export function getFreshnessStatus(timestamp) {
  if (!timestamp) return { text: 'Live', colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' };
  const diffMinutes = Math.floor((new Date() - new Date(timestamp)) / (1000 * 60));
  if (diffMinutes < 15) return { text: 'Live', colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' };
  if (diffMinutes < 60) return { text: `${diffMinutes}m ago`, colorClass: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' };
  if (diffMinutes < 1440) {
    const diffHours = Math.floor(diffMinutes / 60);
    return { text: `${diffHours}h ago`, colorClass: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400' };
  }
  return { text: 'Recent', colorClass: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400' };
}
