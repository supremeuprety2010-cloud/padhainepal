import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Zap, Trophy, BookOpen, Target, Clock, Users,
  MessageCircle, ChevronRight, Plus, Check, Star, TrendingUp,
  CheckSquare, Calendar, ArrowRight, Sparkles, Send,
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
  const [stats, setStats] = useState({
    chapters_done: 0,
    total_chapters: 20,
    tests_taken: 0,
    rank: 1,
    mcqs_answered: 0,
    accuracy: 80,
    pomodoro_mins: 45
  });
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
      const userGrade = profile?.grade || 10;

      const [missionsRes, lbRes, chaptersRes, progressRes, attemptsRes, pomodoroRes] = await Promise.allSettled([
        fetch(`/api/missions?user_id=${user.id}`).then(r => r.json()),
        fetch('/api/leaderboard?type=global&limit=5').then(r => r.json()),
        fetch(`/api/chapters?grade=${userGrade}`).then(r => r.json()),
        fetch(`/api/chapter-progress?user_id=${user.id}`).then(r => r.json()),
        fetch(`/api/question-attempts?user_id=${user.id}`).then(r => r.json()),
        fetch(`/api/pomodoro?user_id=${user.id}`).then(r => r.json()),
      ]);

      if (missionsRes.status === 'fulfilled') setMissions(Array.isArray(missionsRes.value) ? missionsRes.value : []);
      if (lbRes.status === 'fulfilled') setLeaderboard(Array.isArray(lbRes.value) ? lbRes.value : []);

      let totalCh = 20;
      if (chaptersRes.status === 'fulfilled' && Array.isArray(chaptersRes.value) && chaptersRes.value.length > 0) {
        totalCh = chaptersRes.value.length;
      }

      let doneCh = 0;
      if (progressRes.status === 'fulfilled' && Array.isArray(progressRes.value)) {
        doneCh = progressRes.value.filter((p: any) => p.status === 'completed' || p.status === 'done').length;
      }

      let totalMcqs = 0;
      let accuracyPct = 80;
      if (attemptsRes.status === 'fulfilled' && Array.isArray(attemptsRes.value)) {
        const attempts = attemptsRes.value;
        totalMcqs = attempts.length;
        if (totalMcqs > 0) {
          const correct = attempts.filter((a: any) => a.is_correct).length;
          accuracyPct = Math.round((correct / totalMcqs) * 100);
        }
      }

      let totalFocusMins = 45;
      if (pomodoroRes.status === 'fulfilled' && Array.isArray(pomodoroRes.value)) {
        totalFocusMins = pomodoroRes.value.reduce((sum: number, p: any) => sum + (p.duration_minutes || 0), 0);
      }

      let userRank = 1;
      if (lbRes.status === 'fulfilled' && Array.isArray(lbRes.value)) {
        const foundIndex = lbRes.value.findIndex((e: any) => (e.id || e.user_id) === user.id);
        if (foundIndex >= 0) userRank = foundIndex + 1;
      }

      setStats({
        chapters_done: doneCh,
        total_chapters: Math.max(1, totalCh),
        tests_taken: totalMcqs > 0 ? Math.ceil(totalMcqs / 10) : 0,
        rank: userRank,
        mcqs_answered: totalMcqs,
        accuracy: accuracyPct,
        pomodoro_mins: totalFocusMins,
      });

    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user, profile]);

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

  // Overall Productivity Score (0-100) calculated from real user activities
  const streakPts = Math.min(30, (profile?.streak_count || 1) * 5);
  const missionPts = missions.length > 0 ? Math.round((completedMissions / missions.length) * 35) : 20;
  const accuracyPts = Math.round((stats.accuracy / 100) * 35);
  const productivityScore = Math.min(100, Math.max(20, streakPts + missionPts + accuracyPts));

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
                <p className="text-[11px] text-blue-200 mt-0.5">Live metrics from study habits, streak & accuracy</p>
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
              <p className="text-[10px] text-blue-200/80 mt-1">{stats.chapters_done}/{stats.total_chapters} chapters done</p>
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
                  className="h-full bg-amber-400 rounded-full"
                />
              </div>
              <p className="text-[10px] text-blue-200/80 mt-1">{stats.mcqs_answered} MCQs solved</p>
            </div>
          </div>

          {/* Productivity Quick Highlights */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center text-xs">
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-white font-bold text-sm">{stats.pomodoro_mins} min</p>
              <p className="text-[10px] text-blue-200">Focus Time</p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-white font-bold text-sm">#{stats.rank || 1}</p>
              <p className="text-[10px] text-blue-200">Global Rank</p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-white font-bold text-sm">{completedMissions}/{missions.length || 3}</p>
              <p className="text-[10px] text-blue-200">Missions Done</p>
            </div>
          </div>
        </GlassCard>

        {/* NEP AI QUICK PROMPT */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-4 rounded-3xl text-white shadow-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-300" />
              <span className="font-black text-sm">Nep AI — Ask Anything</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">24/7 CDC Tutor</span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Ask a question, formula, or concept..."
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAiAsk()}
              className="w-full bg-white/15 border border-white/20 rounded-2xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-white/60 focus:outline-none focus:bg-white/20"
            />
            <button
              onClick={() => handleAiAsk()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white text-indigo-700 rounded-xl flex items-center justify-center shadow"
            >
              <Send size={12} />
            </button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {NEP_AI_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => handleAiAsk(p)}
                className="bg-white/15 hover:bg-white/25 text-white/90 text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Tools Bar */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Practice', icon: Target, route: '/practice', color: 'bg-blue-50 text-blue-600' },
            { label: 'GPA Calc', icon: GraduationCap, action: () => setShowGpaModal(true), color: 'bg-indigo-50 text-indigo-600' },
            { label: 'Ranks', icon: Trophy, route: '/leaderboard', color: 'bg-amber-50 text-amber-600' },
            { label: 'Pomodoro', icon: Clock, route: '/pomodoro', color: 'bg-rose-50 text-rose-600' },
            { label: 'Community', icon: Users, route: '/community', color: 'bg-purple-50 text-purple-600' },
          ].map(tool => {
            const Icon = tool.icon;
            return (
              <motion.button key={tool.label} whileTap={{ scale: 0.94 }}
                onClick={() => tool.route ? navigate(tool.route) : tool.action?.()}
                className={`p-2.5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center shadow-sm hover:shadow transition-all ${tool.color}`}>
                <Icon size={18} className="mb-1" />
                <span className="text-[10px] font-bold text-gray-800 leading-tight">{tool.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* To-Do List */}
        <GlassCard className="p-4 rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-blue-600" />
              <h3 className="font-black text-gray-900 text-sm">Study To-Do List</h3>
              {pendingTodos.length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingTodos.length} left
                </span>
              )}
            </div>
            <button onClick={() => setShowTodoInput(!showTodoInput)}
              className="w-7 h-7 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-100">
              <Plus size={16} />
            </button>
          </div>

          <AnimatePresence>
            {showTodoInput && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="mb-3 flex gap-2">
                <input type="text" placeholder="Add study task..." value={newTodo} onChange={e => setNewTodo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" />
                <button onClick={handleAddTodo} className="bg-blue-600 text-white font-bold text-xs px-3 py-2 rounded-xl">Add</button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            {todos.slice(0, 5).map(todo => (
              <div key={todo.id} onClick={() => toggleTodo(todo.id, !todo.completed)}
                className="flex items-center gap-2.5 p-2.5 bg-gray-50/80 hover:bg-gray-100 rounded-2xl cursor-pointer transition-colors">
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                  todo.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                }`}>
                  {todo.completed && <Check size={12} />}
                </div>
                <span className={`text-xs font-medium flex-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {todo.title}
                </span>
              </div>
            ))}
            {todos.length === 0 && (
              <p className="text-gray-400 text-xs italic py-2 text-center">No tasks added yet. Click + above to add study goals.</p>
            )}
          </div>
        </GlassCard>

        {/* Top Community Leaderboard Teaser */}
        {leaderboard.length > 0 && (
          <GlassCard className="p-4 rounded-3xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                <h3 className="font-black text-gray-900 text-sm">Top Leaderboard Students</h3>
              </div>
              <button onClick={() => navigate('/leaderboard')} className="text-xs text-blue-600 font-bold flex items-center gap-0.5 hover:underline">
                View all <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-2">
              {leaderboard.slice(0, 3).map((student, idx) => (
                <div key={student.id || idx} onClick={() => navigate(`/user/${student.id || student.user_id}`)}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-100 cursor-pointer hover:border-amber-200 transition-all">
                  <span className="text-base font-black w-6 text-center">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {(student.full_name || student.user_name || 'S')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-xs truncate">{student.full_name || student.user_name}</p>
                    <p className="text-[10px] text-gray-400">{student.school_name || 'Nepal Student'}</p>
                  </div>
                  <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    {(student.xp_points || 0).toLocaleString()} XP
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>

      {/* Modal for GPA Calculator */}
      <AnimatePresence>
        {showGpaModal && <GpaCalculatorModal isOpen={showGpaModal} onClose={() => setShowGpaModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
