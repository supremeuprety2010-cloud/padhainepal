import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Flame, Zap } from 'lucide-react';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminBadge from '../components/AdminBadge';

type Tab = 'global' | 'school' | 'district';

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>('global');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let url = `/api/leaderboard?type=${tab}&limit=20`;
    if (tab === 'school' && profile?.school_id) url += `&school_id=${profile.school_id}`;
    if (tab === 'district' && profile?.district) url += `&district=${encodeURIComponent(profile.district)}`;
    fetch(url).then(r => r.json()).then(setEntries).catch(() => setEntries([])).finally(() => setLoading(false));
  }, [tab, profile]);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-amber-50 pb-24">
      <div className="bg-gradient-to-r from-amber-500 to-yellow-600 px-5 pt-12 pb-8">
        <BackButton light fallback="/home" />
        <h1 className="text-white text-2xl font-black flex items-center gap-2"><Trophy size={24} /> Leaderboard</h1>
        <p className="text-white/70 text-sm">Weekly rankings · Resets every Monday</p>
      </div>

      <div className="px-5 mt-4">
        {/* Tabs */}
        <div className="flex bg-white/80 backdrop-blur rounded-2xl p-1 gap-1 mb-5 shadow-sm">
          {(['global', 'school', 'district'] as Tab[]).map(t => (
            <motion.button key={t} whileTap={{ scale: 0.95 }} onClick={() => setTab(t)} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all capitalize ${tab === t ? 'bg-amber-500 text-white shadow' : 'text-gray-500'}`}>
              {t === 'global' ? '🌍 Global' : t === 'school' ? '🏫 School' : '📍 District'}
            </motion.button>
          ))}
        </div>

        {loading ? <LoadingSpinner size="lg" text="Loading rankings..." /> : (
          <div className="space-y-2">
            {entries.map((entry: any, i: number) => {
              const isMe = entry.user_id === user?.id;
              return (
                <motion.div key={entry.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <GlassCard className={`p-4 ${isMe ? 'border-2 border-amber-400 bg-amber-50/50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl w-8 text-center">{i < 3 ? medals[i] : `#${i + 1}`}</span>
                      <motion.div whileTap={{ scale: 0.9 }} onClick={() => navigate(`/user/${entry.user_id}`)}
                        className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 cursor-pointer">
                        {entry.user_name?.[0]?.toUpperCase() || 'S'}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`font-semibold text-sm cursor-pointer hover:underline ${isMe ? 'text-amber-700' : 'text-gray-800'}`} onClick={() => navigate(`/user/${entry.user_id}`)}>
                            {entry.user_name} {isMe && '(You)'}
                          </p>
                          <AdminBadge userId={entry.user_id} size="sm" />
                        </div>
                        <p className="text-xs text-gray-400">{entry.school_name || 'Nepal'}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-amber-600 font-bold text-sm">
                          <Zap size={12} fill="currentColor" />
                          {entry.xp_points?.toLocaleString()}
                        </div>
                        {entry.streak_count > 0 && (
                          <div className="flex items-center gap-1 text-orange-500 text-xs justify-end mt-0.5">
                            <Flame size={10} fill="currentColor" />
                            {entry.streak_count}d
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
            {entries.length === 0 && (
              <div className="text-center py-12">
                <Trophy size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No entries yet for this category</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
