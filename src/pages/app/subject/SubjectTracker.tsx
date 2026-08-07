import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Circle, Info } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import GlassCard from '../../../components/GlassCard';
import LoadingSpinner from '../../../components/LoadingSpinner';

type Status = 'not_started' | 'in_progress' | 'completed';

const STATUS_META: Record<Status, { label: string; icon: any; color: string }> = {
  not_started: { label: 'Not Started', icon: Circle,      color: 'text-gray-400' },
  in_progress:  { label: 'In Progress', icon: Clock,       color: 'text-amber-500' },
  completed:    { label: 'Completed',   icon: CheckCircle, color: 'text-green-500' },
};

export default function SubjectTracker({ subject }: { subject: string }) {
  const { user } = useAuth();
  const [chapters, setChapters] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch(`/api/chapters?subject=${encodeURIComponent(subject)}`).then(r => r.json()),
      fetch(`/api/chapter-progress?user_id=${user.id}&subject=${encodeURIComponent(subject)}`).then(r => r.json()),
    ]).then(([chs, prog]) => {
      setChapters(Array.isArray(chs) ? chs : []);
      const map: Record<string, Status> = {};
      (Array.isArray(prog) ? prog : []).forEach((p: any) => { map[p.chapter_id] = p.status; });
      setProgress(map);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [subject, user]);

  const done = Object.values(progress).filter(s => s === 'completed' || (s as string) === 'done').length;
  const inProg = Object.values(progress).filter(s => s === 'in_progress').length;
  const pct = chapters.length > 0 ? Math.round((done / chapters.length) * 100) : 0;

  return (
    <div className="px-4 pt-4">
      {/* Progress summary */}
      <GlassCard className="p-4 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 font-medium">{done}/{chapters.length} chapters</span>
          <span className="font-bold text-blue-600">{pct}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" />
        </div>
        <div className="flex gap-3 mt-3">
          {[['Not Started', chapters.length - done - inProg, 'text-gray-500'],
            ['In Progress', inProg, 'text-amber-600'],
            ['Completed', done, 'text-green-600']].map(([l, c, cls]) => (
            <div key={l as string} className="flex-1 text-center">
              <p className={`text-lg font-black ${cls}`}>{c as number}</p>
              <p className="text-xs text-gray-400">{l as string}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-3 mb-4 bg-blue-50/50 border border-blue-200">
        <div className="flex items-start gap-2">
          <Info size={13} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800">Progress updates automatically: ≥5 MCQs → In Progress, ≥80% test score → Completed</p>
        </div>
      </GlassCard>

      {loading ? <LoadingSpinner size="lg" text="Loading chapters..." /> : (
        <div className="space-y-2">
          {chapters.map((ch: any, i: number) => {
            const status: Status = (progress[ch.id] as Status) || 'not_started';
            const meta = STATUS_META[status];
            const Icon = meta.icon;
            return (
              <motion.div key={ch.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0`}>
                      {ch.chapter_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{ch.title}</p>
                      {ch.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{ch.description}</p>}
                    </div>
                    <div className={`flex items-center gap-1 ${meta.color}`}>
                      <Icon size={18} fill={status === 'completed' ? 'currentColor' : 'none'} />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
