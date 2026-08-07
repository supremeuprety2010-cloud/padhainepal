import { Flame } from 'lucide-react';

export default function StreakBadge({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full text-xs font-bold">
      <Flame size={12} fill="currentColor" />
      <span>{streak} day{streak !== 1 ? 's' : ''}</span>
    </div>
  );
}
