import { cn } from '@/lib/utils';

export function BedIndicator({ label, icon: Icon, available, total, onClick, isSelected }) {
  const percentage = total > 0 ? Math.min(100, Math.round((available / total) * 100)) : 0;

  let statusColor = 'bg-emerald-500';
  let textColor = 'text-emerald-600 dark:text-emerald-400';
  if (percentage === 0) {
    statusColor = 'bg-red-500';
    textColor = 'text-red-600 dark:text-red-400';
  } else if (percentage < 30) {
    statusColor = 'bg-amber-500';
    textColor = 'text-amber-600 dark:text-amber-400';
  }

  return (
    <div 
      onClick={onClick}
      className={cn(
        'rounded-xl border p-2 text-center transition-all select-none',
        onClick ? 'cursor-pointer' : '',
        isSelected 
          ? 'border-red-500 bg-red-50/60 dark:bg-red-950/30 shadow-xs ring-1 ring-red-500' 
          : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-card hover:border-gray-300 dark:hover:border-gray-700'
      )}
    >
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground truncate">{label}</span>
      </div>
      <p className={cn('text-base sm:text-xl font-black tracking-tight leading-tight', textColor)}>{available}</p>
      <div className="my-1 h-1 sm:h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden w-full">
        <div
          className={cn('h-full rounded-full transition-all duration-500', statusColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-[9px] sm:text-[11px] text-muted-foreground font-medium">of {total}</p>
    </div>
  );
}

export default BedIndicator;
