import { Zap } from 'lucide-react';

export default function XPBadge({ xp }: { xp: number }) {
  return (
    <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold">
      <Zap size={12} fill="currentColor" />
      <span>{xp.toLocaleString()} XP</span>
    </div>
  );
}
