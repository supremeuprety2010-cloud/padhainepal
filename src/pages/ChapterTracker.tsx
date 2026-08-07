import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';

type Status = 'not_started' | 'in_progress' | 'done';

export default function ChapterTracker() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const subject = searchParams.get('subject') || '';
  const [chapters, setChapters] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subject || !user) return;
    Promise.all([
      fetch(`/api/chapters?subject=${encodeURIComponent(subject)}`).then(r => r.json()),
      fetch(`/api/chapter-progress?user_id=${user.id}&subject=${encodeURIComponent(subject)}`).then(r => r.json()),
    ]).then(([chs, prog]) => {
      setChapters(chs);
      const map: Record<string, Status> = {};
      prog.forEach((p: any) => { map[p.chapter_id] = p.status; });
      setProgress(map);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [subject, user]);

  const updateStatus = async (chapterId: string, status: Status) => {
    setProgress(p => ({ ...p, [chapterId]: status }));
    await fetch('/api/chapter-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user?.id, chapter_id: chapterId, subject, status }),
    }).catch(() => {});
  };

  const done = Object.values(progress).filter(s => s === 'done').length;
  const inProgress = Object.values(progress).filter(s => s === 'in_progress').length;
  const pct = chapters.length > 0 ? Math.round((done / chapters.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 pb-24">
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-5 pt-12 pb-8">
        <BackButton light fallback="/study" />
        <h1 className="text-white text-2xl font-black">{subject}</h1>
        <p className="text-white/70 text-sm">Chapter Progress Tracker</p>
        <div className="mt-4">
          <div className="flex justify-between text-white/80 text-xs mb-1">
            <span>{done} of {chapters.length} chapters done</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="px-5 mt-4">
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[['Not Started', chapters.length - done - inProgress, 'bg-gray-100 text-gray-600'], ['In Progress', inProgress, 'bg-amber-100 text-amber-700'], ['Done', done, 'bg-green-100 text-green-700']].map(([label, count, cls]) => (
            <GlassCard key={label as string} className={`p-3 text-center ${cls}`}>
              <p className="text-xl font-black">{count as number}</p>
              <p className="text-xs font-medium">{label as string}</p>
            </GlassCard>
          ))}
        </div>

        {loading ? <LoadingSpinner size="lg" text="Loading chapters..." /> : (
          <div className="space-y-2">
            {chapters.map((ch: any, i: number) => {
              const status = progress[ch.id] || 'not_started';
              return (
                <motion.div key={ch.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm">{ch.chapter_number}. {ch.title}</p>
                        {ch.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{ch.description}</p>}
                      </div>
                      <div className="flex gap-1.5">
                        {(['not_started', 'in_progress', 'done'] as Status[]).map(s => {
                          const icons = { not_started: Circle, in_progress: Clock, done: CheckCircle };
                          const colors = { not_started: status === s ? 'text-gray-500' : 'text-gray-300', in_progress: status === s ? 'text-amber-500' : 'text-gray-300', done: status === s ? 'text-green-500' : 'text-gray-300' };
                          const Icon = icons[s];
                          return (
                            <motion.button key={s} whileTap={{ scale: 0.8 }} onClick={() => updateStatus(ch.id, s)} className={`${colors[s]} min-w-[44px] min-h-[44px] flex items-center justify-center`}>
                              <Icon size={20} fill={status === s && s === 'done' ? 'currentColor' : 'none'} />
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
