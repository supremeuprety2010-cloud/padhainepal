import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Zap, Trophy, BookOpen, Target, Clock, Users,
  MessageCircle, ChevronRight, Plus, Check, Star, TrendingUp,
  CheckSquare, Calendar, ArrowRight, Calculator, Sparkles, Send,
  GraduationCap, Activity, Award
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTodos } from '../../hooks/useTodos';
import GlassCard from '../../components/GlassCard';
import AppHeader from '../../components/AppHeader';
import GpaCalculatorModal from '../../components/GpaCalculatorModal';
import { SUBJECT_ICONS, SUBJECT_COLORS } from '../../lib/subjectMeta';

const EXAM_DATE = new Date('2025-11-28'); // NEB Grade 12 exam approximate date

function daysUntilExam() {
  const now = new Date();
  const diff = Math.ceil((EXAM_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const NEP_AI_PROMPTS = [
  '📐 Solve 2x² + 5x - 3 = 0',
  '⚛️ Explain Newton\'s Laws',
  '🧪 Acids vs Bases difference',
  '🎓 How CDC GPA is calculated?',
];

export default function Home() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { todos, addTodo, toggleTodo } = useTodos();
  const [missions, setMissions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [recentProgress, setRecentProgress] = useState<any[]>([]);
  const [stats, setStats] = useState({ chapters_done: 0, total_chapters: 24, tests_taken: 0, rank: 0, mcqs_answered: 0, accuracy: 78, pomodoro_mins: 110 });
  const [newTodo, setNewTodo] = useState('');
  const [showTodoInput, setShowTodoInput] = useState(false);
  const [loading, setLoading] = useState(true);

  // GPA Calculator Modal State
  const [showGpaModal, setShowGpaModal] = useState(false);

  // Nep AI Quick Input State
  const [aiQuery, setAiQuery] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [missionsRes, lbRes, attemptsRes, progressRes, pomodoroRes] = await Promise.allSettled([
        fetch('/api/missions').then(r => r.json()),
        fetch('/api/leaderboard?type=global&limit=3').then(r => r.json()),
        fetch(`/api/test-attempts?user_id=${user.id}&limit=10`).then(r => r.json()),
        fetch(`/api/chapter-progress?user_id=${user.id}`).then(r => r.json()),
        fetch(`/api/pomodoro?user_id=${user.id}`).then(r => r.json()),
      ]);

      if (missionsRes.status === 'fulfilled') setMissions(Array.isArray(missionsRes.value) ? missionsRes.value : []);
      if (lbRes.status === 'fulfilled') setLeaderboard(Array.isArray(lbRes.value) ? lbRes.value : []);
      if (attemptsRes.status === 'fulfilled') setRecentProgress(Array.isArray(attemptsRes.value) ? attemptsRes.value : []);

      if (progressRes.status === 'fulfilled') {
        const prog = Array.isArray(progressRes.value) ? progressRes.value : [];
        const done = prog.filter((p: any) => p.status === 'completed' || p.status === 'done').length;
        setStats(s => ({ ...s, chapters_done: done }));
      }

      if (attemptsRes.status === 'fulfilled' && Array.isArray(attemptsRes.value)) {
        const attemptsArr = attemptsRes.value;
        const totalTests = attemptsArr.length;
        const avgScore = totalTests > 0
          ? Math.round(attemptsArr.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / totalTests)
          : 78;
        setStats(s => ({ ...s, tests_taken: totalTests, accuracy: avgScore }));
      }

      if (pomodoroRes.status === 'fulfilled' && pomodoroRes.value?.today_minutes !== undefined) {
        setStats(s => ({ ...s, pomodoro_mins: pomodoroRes.value.today_minutes }));
      }

      if (lbRes.status === 'fulfilled' && Array.isArray(lbRes.value)) {
        const rank = lbRes.value.findIndex((e: any) => e.user_id === user.id) + 1;
        if (rank > 0) setStats(s => ({ ...s, rank }));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    await addTodo(newTodo.trim());
    setNewTodo('');
    setShowTodoInput(false);
  };

  const handleAiAsk = (promptText?: string) => {
    const q = promptText || aiQuery.trim();
    if (!q) {
      navigate('/ai-tutor');
      return;
    }
    navigate(`/ai-tutor?q=${encodeURIComponent(q)}`);
  };

  const trialDaysLeft = () => {
    if (!profile?.trial_start) return 3;
    const start = new Date(profile.trial_start);
    const diff = Math.ceil(3 - (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const examDays = daysUntilExam();
  const pendingTodos = todos.filter(t => !t.completed);
  const completedMissions = missions.filter(m => m.completed).length;
  const missionXP = missions.reduce((s, m) => s + (m.xp_reward || 0), 0);

  // Overall Productivity Score (0-100)
  const streakPts = Math.min(30, (profile?.streak_count || 1) * 5);
  const missionPts = missions.length > 0 ? Math.round((completedMissions / missions.length) * 30) : 15;
  const accuracyPts = Math.round((stats.accuracy / 100) * 40);
  const productivityScore = Math.min(100, Math.max(25, streakPts + missionPts + accuracyPts));

  // Overall Syllabus Completion
  const overallSyllabusPct = Math.min(100, Math.round((stats.chapters_done / Math.max(1, stats.total_chapters)) * 100));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <AppHeader showLogo showActions />

      <div className="pt-16 px-4 space-y-4">
        {/* Hero greeting */}
        <div className="pt-4 pb-2">
          <p className="text-gray-400 text-sm">{greeting()},</p>
          <h1 className="text-2xl font-black text-gray-900">{profile?.full_name?.split(' ')[0] || 'Student'} 👋</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full text-xs font-bold">
              <Flame size={12} fill="currentColor" /> {profile?.streak_count || 0} day streak
            </div>
            <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold">
              <Zap size={12} fill="currentColor" /> {(profile?.xp_points || 0).toLocaleString()} XP
            </div>
            {trialDaysLeft() > 0 && (
              <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold">
                🎁 {trialDaysLeft()}d free trial
              </div>
            )}
          </div>
        </div>

        {/* Exam countdown */}
        {examDays > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-4 flex items-center justify-between shadow-md">
            <div>
              <p className="text-blue-200 text-xs font-medium">NEB Exam Countdown</p>
              <p className="text-white font-black text-2xl">{examDays} days</p>
              <p className="text-blue-200 text-xs mt-0.5">Stay consistent every day!</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Calendar size={28} className="text-white" />
            </div>
          </motion.div>
        )}

        {/* OVERALL PRODUCTIVITY & STUDY PROGRESS SECTION */}
        <GlassCard className="p-4 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/30">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="font-black text-white text-sm leading-none flex items-center gap-1.5">
                  Overall Productivity & Progress
                </h3>
                <p className="text-[11px] text-blue-200 mt-0.5">Calculated from study habits, streak & accuracy</p>
              </div>
            </div>

            <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <TrendingUp size={12} /> {productivityScore}% Score
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Syllabus Coverage */}
            <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
              <p className="text-[11px] text-blue-200 font-semibold">Syllabus Completion</p>
              <p className="text-2xl font-black text-white mt-0.5">{overallSyllabusPct}%</p>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mt-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallSyllabusPct}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-emerald-400 rounded-full"
                />
              </div>
            </div>

            {/* Test Accuracy */}
            <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
              <p className="text-[11px] text-blue-200 font-semibold">Practice Accuracy</p>
              <p className="text-2xl font-black text-white mt-0.5">{stats.accuracy}%</p>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mt-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.accuracy}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-blue-400 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Quick Metrics Breakdown */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs text-blue-100 pt-1">
            <div className="bg-white/5 rounded-xl p-2">
              <p className="font-bold text-white text-sm">{stats.chapters_done}</p>
              <p className="text-[10px] text-blue-200">Chapters Done</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2">
              <p className="font-bold text-white text-sm">{stats.pomodoro_mins}m</p>
              <p className="text-[10px] text-blue-200">Focus Time</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2">
              <p className="font-bold text-white text-sm">{stats.tests_taken}</p>
              <p className="text-[10px] text-blue-200">Tests Attempted</p>
            </div>
          </div>
        </GlassCard>

        {/* Quick stats 4-grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: '📚', value: stats.chapters_done, label: 'Done', color: 'bg-green-50' },
            { icon: '🎯', value: stats.tests_taken, label: 'Tests', color: 'bg-purple-50' },
            { icon: '🏆', value: stats.rank > 0 ? `#${stats.rank}` : '--', label: 'Rank', color: 'bg-amber-50' },
            { icon: '🔥', value: profile?.streak_count || 0, label: 'Streak', color: 'bg-orange-50' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center`}>
              <div className="text-xl mb-1">{s.icon}</div>
              <p className="text-base font-black text-gray-800 leading-none">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Daily Missions */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
              <Star size={15} className="text-amber-500" fill="currentColor" /> Daily Missions
            </h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {completedMissions}/{missions.length} · {missionXP} XP
            </span>
          </div>
          {missions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">No missions today</p>
          ) : (
            <div className="space-y-2">
              {missions.slice(0, 4).map((m: any) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    m.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {m.completed && <Check size={10} className="text-white" />}
                  </div>
                  <span className={`text-sm flex-1 ${m.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{m.title}</span>
                  <span className="text-xs text-amber-600 font-bold">+{m.xp_reward}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Continue Learning */}
        {(profile?.subjects || []).length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">Continue Learning</h3>
              <button onClick={() => navigate('/study')} className="text-xs text-blue-600 font-semibold flex items-center gap-0.5">
                All subjects <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 snap-x">
              {(profile?.subjects || []).slice(0, 5).map((subj: string) => (
                <motion.div key={subj} whileTap={{ scale: 0.95 }} onClick={() => navigate(`/study/${encodeURIComponent(subj)}`)}
                  className="flex-shrink-0 w-28 snap-start cursor-pointer">
                  <div className={`bg-gradient-to-br ${SUBJECT_COLORS[subj] || 'from-gray-500 to-gray-600'} rounded-2xl p-3.5 h-24 flex flex-col justify-between shadow-md`}>
                    <span className="text-2xl">{SUBJECT_ICONS[subj] || '📚'}</span>
                    <p className="text-white font-bold text-xs leading-tight">{subj}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions grid (Practice, GPA, Nep AI, Study Room, Doubts, Pomodoro, Leaderboard) */}
        <div>
          <h3 className="font-bold text-gray-800 text-sm mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* PRACTICE HUB CARD */}
            <GlassCard hover onClick={() => navigate('/practice')} className="p-3.5 flex items-center gap-3 border border-blue-100 bg-blue-50/40">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-200">
                <Target size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 text-sm flex items-center gap-1">
                  Practice <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-extrabold">MCQs</span>
                </p>
                <p className="text-xs text-gray-400 truncate">MCQs & Mock Tests</p>
              </div>
            </GlassCard>

            {/* CDC GPA Calculator Action Card */}
            <GlassCard hover onClick={() => navigate('/gpa-calculator')} className="p-3.5 flex items-center gap-3 border border-emerald-100 bg-emerald-50/30">
              <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Calculator size={20} className="text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 text-sm flex items-center gap-1">
                  GPA <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-extrabold">CDC</span>
                </p>
                <p className="text-xs text-gray-400 truncate">Calculate Marks</p>
              </div>
            </GlassCard>

            {/* Nep AI Tutor Action Card */}
            <GlassCard hover onClick={() => navigate('/ai-tutor')} className="p-3.5 flex items-center gap-3 border border-amber-100 bg-amber-50/30">
              <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} className="text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 text-sm flex items-center gap-1">
                  Nep AI <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-extrabold">24/7</span>
                </p>
                <p className="text-xs text-gray-400 truncate">AI Doubt Solver</p>
              </div>
            </GlassCard>

            <GlassCard hover onClick={() => navigate('/study-room')} className="p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Users size={18} className="text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 text-sm">Study Room</p>
                <p className="text-xs text-gray-400 truncate">Study together</p>
              </div>
            </GlassCard>

            <GlassCard hover onClick={() => navigate('/doubts')} className="p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <MessageCircle size={18} className="text-teal-600" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 text-sm">Doubts</p>
                <p className="text-xs text-gray-400 truncate">Ask & answer</p>
              </div>
            </GlassCard>

            <GlassCard hover onClick={() => navigate('/pomodoro')} className="p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Clock size={18} className="text-rose-600" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 text-sm">Pomodoro</p>
                <p className="text-xs text-gray-400 truncate">Focus & Music</p>
              </div>
            </GlassCard>

            <GlassCard hover onClick={() => navigate('/leaderboard')} className="p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Trophy size={18} className="text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 text-sm">Leaderboard</p>
                <p className="text-xs text-gray-400 truncate">Weekly rank</p>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* PROMINENT NEP AI ASSISTANT WIDGET ON HOME */}
        <GlassCard className="p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-300">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-sm leading-none flex items-center gap-1.5">
                  Nep AI Assistant
                  <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">CDC AI</span>
                </h3>
                <p className="text-[11px] text-amber-800 font-medium mt-0.5">Instant NEB curriculum doubt solver</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/ai-tutor')}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-white/80 px-2.5 py-1 rounded-full border border-amber-200"
            >
              Open Tutor <ChevronRight size={12} />
            </button>
          </div>

          {/* Direct Input Field on Home */}
          <div className="flex gap-2 items-center mt-3">
            <div className="flex-1 bg-white border border-amber-200/80 rounded-2xl px-3.5 py-2.5 shadow-sm flex items-center">
              <input
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()}
                placeholder="Ask Nep AI any study doubt or problem..."
                className="w-full bg-transparent text-xs text-gray-800 placeholder-gray-400 focus:outline-none"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => handleAiAsk()}
              className="bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-2xl shadow-md shadow-amber-300 flex items-center justify-center flex-shrink-0"
            >
              <Send size={15} />
            </motion.button>
          </div>

          {/* Quick Prompt Pills */}
          <div className="flex gap-1.5 overflow-x-auto mt-2.5 pb-0.5 scrollbar-hide">
            {NEP_AI_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleAiAsk(prompt.replace(/^[^\s]+\s*/, ''))}
                className="bg-white/90 hover:bg-white text-gray-700 border border-amber-200 text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 transition-colors shadow-xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* To-do widget */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
              <CheckSquare size={15} className="text-blue-500" /> To-Do
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{pendingTodos.length} pending</span>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowTodoInput(s => !s)}
                className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <Plus size={14} className="text-white" />
              </motion.button>
            </div>
          </div>
          <AnimatePresence>
            {showTodoInput && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
                <div className="flex gap-2">
                  <input value={newTodo} onChange={e => setNewTodo(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
                    placeholder="Add a task..." autoFocus
                    className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-300" />
                  <button onClick={handleAddTodo} className="bg-blue-600 text-white px-3 rounded-xl text-sm font-semibold">Add</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pendingTodos.slice(0, 5).map(t => (
              <motion.div key={t.id} layout className="flex items-center gap-2.5">
                <button onClick={() => toggleTodo(t.id, true)}
                  className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 hover:border-green-400 transition-colors" />
                <span className="text-sm text-gray-700 flex-1 truncate">{t.title}</span>
                {t.subject && <span className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">{t.subject}</span>}
              </motion.div>
            ))}
            {pendingTodos.length === 0 && <p className="text-sm text-gray-400 text-center py-2">✅ All done! Great work.</p>}
          </div>
          {pendingTodos.length > 5 && (
            <button onClick={() => navigate('/todo')} className="w-full text-xs text-blue-600 font-semibold mt-2 text-center">
              +{pendingTodos.length - 5} more tasks →
            </button>
          )}
        </GlassCard>

        {/* Leaderboard preview */}
        {leaderboard.length > 0 && (
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
                <Trophy size={15} className="text-amber-500" /> Top This Week
              </h3>
              <button onClick={() => navigate('/leaderboard')} className="text-xs text-blue-600 font-semibold">See all</button>
            </div>
            <div className="space-y-2.5">
              {leaderboard.slice(0, 3).map((e: any, i: number) => (
                <div key={e.id} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center">{['🥇','🥈','🥉'][i]}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {e.user_name?.[0]?.toUpperCase() || 'S'}
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-700 truncate">{e.user_name}</span>
                  <span className="text-xs font-bold text-amber-600">{e.xp_points?.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Recent activity */}
        {recentProgress.length > 0 && (
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
                <TrendingUp size={15} className="text-blue-500" /> Recent Tests
              </h3>
              <button onClick={() => navigate('/practice')} className="text-xs text-blue-600 font-semibold">View all</button>
            </div>
            <div className="space-y-2">
              {recentProgress.slice(0, 3).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{a.subject || a.mode || 'Practice'}</p>
                    <p className="text-xs text-gray-400">{new Date(a.submitted_at).toLocaleDateString()}</p>
                  </div>
                  <div className={`text-sm font-black px-2.5 py-1 rounded-full ${
                    (a.score || 0) >= 80 ? 'bg-green-100 text-green-700' :
                    (a.score || 0) >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>{a.score || 0}%</div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>

      {/* CDC GPA CALCULATOR MODAL (if opened directly) */}
      <GpaCalculatorModal
        isOpen={showGpaModal}
        onClose={() => setShowGpaModal(false)}
        userSubjects={profile?.subjects || []}
        userGrade={profile?.grade}
      />
    </div>
  );
}
