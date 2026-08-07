import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Target, TrendingUp, Video, CheckSquare, MessageCircle, Bell, Zap, Flame, Trophy, ChevronRight, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/GlassCard';
import XPBadge from '../components/XPBadge';
import StreakBadge from '../components/StreakBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: 'from-blue-500 to-indigo-600',
  Physics: 'from-purple-500 to-violet-600',
  Chemistry: 'from-green-500 to-emerald-600',
  Biology: 'from-teal-500 to-cyan-600',
  'Computer Science': 'from-orange-500 to-amber-600',
  English: 'from-pink-500 to-rose-600',
  Nepali: 'from-red-500 to-orange-600',
  Accountancy: 'from-yellow-500 to-amber-600',
  Economics: 'from-lime-500 to-green-600',
  'Business Studies': 'from-sky-500 to-blue-600',
  Science: 'from-emerald-500 to-teal-600',
  'Social Studies': 'from-amber-500 to-orange-600',
  Sociology: 'from-fuchsia-500 to-pink-600',
  History: 'from-stone-500 to-gray-600',
};

const SUBJECT_ICONS: Record<string, string> = {
  Mathematics: '📐', Physics: '⚛️', Chemistry: '🧪', Biology: '🧬',
  'Computer Science': '💻', English: '📖', Nepali: '🇳🇵', Accountancy: '📊',
  Economics: '📈', 'Business Studies': '💼', Science: '🔬',
  'Social Studies': '🌍', Sociology: '👥', History: '🏛️',
};

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(true);

  useEffect(() => {
    fetch('/api/missions').then(r => r.json()).then(setMissions).catch(() => {}).finally(() => setLoadingMissions(false));
    fetch('/api/leaderboard?type=global&limit=3').then(r => r.json()).then(setLeaderboard).catch(() => {});
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const trialDaysLeft = () => {
    if (!profile?.trial_start) return 3;
    const start = new Date(profile.trial_start);
    const diff = Math.ceil(3 - (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 pt-12 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-8 w-24 h-24 bg-white rounded-full blur-2xl" />
        </div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-200 text-sm">{greeting()},</p>
              <h1 className="text-white text-xl font-black">{profile?.full_name?.split(' ')[0] || 'Student'} 👋</h1>
            </div>
            <div className="flex items-center gap-2">
              <XPBadge xp={profile?.xp_points || 0} />
              <StreakBadge streak={profile?.streak_count || 0} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur rounded-full px-3 py-1.5 text-white text-xs font-medium">
              Grade {profile?.grade} {profile?.stream ? `· ${profile.stream}` : ''}
            </div>
            {trialDaysLeft() > 0 && (
              <div className="bg-amber-400/90 rounded-full px-3 py-1.5 text-white text-xs font-bold">
                🎁 {trialDaysLeft()} days free trial
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 -mt-12 space-y-5">
        {/* Daily Missions */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Star size={16} className="text-amber-500" /> Daily Missions</h3>
            <span className="text-xs text-gray-400">Resets at midnight</span>
          </div>
          {loadingMissions ? <LoadingSpinner size="sm" /> : (
            <div className="space-y-2">
              {missions.slice(0, 3).map((m: any) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${m.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                    {m.completed && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={`text-sm flex-1 ${m.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{m.title}</span>
                  <span className="text-xs text-amber-600 font-bold">+{m.xp_reward} XP</span>
                </div>
              ))}
              {missions.length === 0 && <p className="text-sm text-gray-400 text-center py-2">No missions today</p>}
            </div>
          )}
        </GlassCard>

        {/* Subjects */}
        <div>
          <h2 className="text-lg font-black text-gray-800 mb-3 px-1">Your Subjects</h2>
          <div className="grid grid-cols-2 gap-3">
            {(profile?.subjects || []).map((subject: string, i: number) => (
              <motion.div key={subject} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard hover onClick={() => navigate(`/subject/${encodeURIComponent(subject)}`)} className="overflow-hidden">
                  <div className={`bg-gradient-to-br ${SUBJECT_COLORS[subject] || 'from-gray-500 to-gray-600'} p-4 pb-8`}>
                    <span className="text-2xl">{SUBJECT_ICONS[subject] || '📚'}</span>
                  </div>
                  <div className="p-3 -mt-4">
                    <p className="font-bold text-gray-800 text-sm leading-tight">{subject}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">Grade {profile?.grade}</span>
                      <ChevronRight size={14} className="text-gray-400" />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mini Leaderboard */}
        {leaderboard.length > 0 && (
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><Trophy size={16} className="text-amber-500" /> Top Students</h3>
              <button onClick={() => navigate('/leaderboard')} className="text-xs text-blue-600 font-semibold">See all</button>
            </div>
            <div className="space-y-2">
              {leaderboard.map((entry: any, i: number) => (
                <div key={entry.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold w-5 text-center">{['🥇', '🥈', '🥉'][i]}</span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {entry.user_name?.[0] || 'S'}
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-700">{entry.user_name}</span>
                  <span className="text-xs font-bold text-amber-600">{entry.xp_points?.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <GlassCard hover onClick={() => navigate('/practice')} className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center"><Target size={20} className="text-blue-600" /></div>
            <div><p className="font-bold text-gray-800 text-sm">Practice</p><p className="text-xs text-gray-400">MCQs</p></div>
          </GlassCard>
          <GlassCard hover onClick={() => navigate('/mock-test')} className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center"><TrendingUp size={20} className="text-purple-600" /></div>
            <div><p className="font-bold text-gray-800 text-sm">Mock Test</p><p className="text-xs text-gray-400">Simulate exam</p></div>
          </GlassCard>
          <GlassCard hover onClick={() => navigate('/ai-tutor')} className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center"><Zap size={20} className="text-amber-600" /></div>
            <div><p className="font-bold text-gray-800 text-sm">Nep AI</p><p className="text-xs text-gray-400">AI Tutor</p></div>
          </GlassCard>
          <GlassCard hover onClick={() => navigate('/pomodoro')} className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-2xl flex items-center justify-center"><Flame size={20} className="text-rose-600" /></div>
            <div><p className="font-bold text-gray-800 text-sm">Focus Timer</p><p className="text-xs text-gray-400">Pomodoro</p></div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
