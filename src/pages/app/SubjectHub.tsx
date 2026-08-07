import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Routes, Route, NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Target, Video, BarChart3, CheckSquare, MessageCircle,
  BookOpen, Zap, ChevronRight, Shuffle, AlertTriangle, Play, Clock,
  Sparkles, TrendingUp, Star, FileText, Bookmark, HelpCircle, Users,
  LayoutGrid, Download, Eye, Check, X, Lightbulb, Award, Info, Filter, User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useXP } from '../../hooks/useXP';
import { SUBJECT_GRADIENTS, SUBJECT_ICONS, SUBJECT_COLORS } from '../../lib/subjectMeta';
import GlassCard from '../../components/GlassCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ChapterRoadmap from './subject/ChapterRoadmap';
import NoteReaderModal, { NoteItem } from '../../components/NoteReaderModal';
import PastPaperAnalysisGrid from '../../components/PastPaperAnalysisGrid';

const TABS = [
  { id: 'overview', label: 'Home',     icon: LayoutGrid   },
  { id: 'tracker',  label: 'Roadmap',  icon: CheckSquare  },
  { id: 'videos',   label: 'Videos',   icon: Video        },
  { id: 'practice', label: 'Practice & Tests', icon: Target },
  { id: 'notes',    label: 'All PDF',  icon: BookOpen     },
  { id: 'doubts',   label: 'Doubts',   icon: MessageCircle},
  { id: 'ppa',      label: 'Papers',   icon: BarChart3    },
];

export default function SubjectHub() {
  const { subject = '' } = useParams<{ subject: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const decoded = decodeURIComponent(subject);
  const gradient = SUBJECT_GRADIENTS[decoded] || 'from-blue-600 to-indigo-700';

  // Check if student is on sub-section page or subject home overview page
  const isOverview = location.pathname.endsWith(`/study/${subject}`) ||
                     location.pathname.endsWith(`/study/${subject}/`) ||
                     location.pathname.endsWith(`/study/${subject}/overview`);

  const currentSection = location.pathname.split('/').pop() || 'overview';

  const handleBack = () => {
    if (isOverview) {
      navigate('/study');
    } else {
      navigate(`/study/${subject}`);
    }
  };

  const goTo = (tab: string) => navigate(`/study/${subject}/${tab}`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      {/* ── Compact Sticky Header ── */}
      <div className={`bg-gradient-to-r ${gradient} sticky top-0 z-30 shadow-md`}>
        <div className="flex items-center gap-3 px-4 py-3.5 max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleBack}
            className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors text-white"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </motion.button>

          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="text-xl flex-shrink-0">{SUBJECT_ICONS[decoded] || '📚'}</span>
            <div className="min-w-0">
              <h1 className="text-white text-base font-black leading-tight truncate">{decoded}</h1>
              <p className="text-white/70 text-[11px] font-medium truncate">
                Grade {profile?.grade}{profile?.stream ? ` · ${profile.stream}` : ''}
                {!isOverview && currentSection !== 'overview' ? ` › ${currentSection.toUpperCase()}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Routes ── */}
      <Routes>
        <Route index         element={<SubjectOverview subject={decoded} onGoTo={goTo} gradient={gradient} />} />
        <Route path="overview" element={<SubjectOverview subject={decoded} onGoTo={goTo} gradient={gradient} />} />
        <Route path="tracker"  element={<ChapterRoadmap  subject={decoded} />} />
        <Route path="videos"   element={<VideosSection   subject={decoded} />} />
        <Route path="practice" element={<PracticeAndMockSection subject={decoded} />} />
        <Route path="notes"    element={<NotesSection     subject={decoded} />} />
        <Route path="doubts"   element={<DoubtsSection    subject={decoded} />} />
        <Route path="ppa"      element={<PPASection       subject={decoded} />} />
        <Route path="mock"     element={<PracticeAndMockSection subject={decoded} defaultMode="mock" />} />
      </Routes>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// OVERVIEW – Exact Order: Roadmap -> Videos -> Practice & Mock -> All PDF -> Doubts
// ════════════════════════════════════════════════════════════════════════════
function SubjectOverview({ subject, onGoTo, gradient }: { subject: string; onGoTo: (t: string) => void; gradient: string }) {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ chapters: 0, done: 0, mcqs: 0, accuracy: 0, videos: 0, tests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.allSettled([
      fetch(`/api/chapters?subject=${encodeURIComponent(subject)}`).then(r => r.json()),
      fetch(`/api/chapter-progress?user_id=${user.id}&subject=${encodeURIComponent(subject)}`).then(r => r.json()),
      fetch(`/api/question-attempts?user_id=${user.id}&limit=200`).then(r => r.json()),
      fetch(`/api/videos?subject=${encodeURIComponent(subject)}`).then(r => r.json()),
    ]).then(([chRes, progRes, attRes, vidRes]) => {
      const chapters = chRes.status === 'fulfilled' ? (chRes.value || []) : [];
      const prog = progRes.status === 'fulfilled' ? (progRes.value || []) : [];
      const attempts = attRes.status === 'fulfilled' ? (attRes.value || []) : [];
      const videos = vidRes.status === 'fulfilled' ? (vidRes.value || []) : [];
      const done = prog.filter((p: any) => p.status === 'completed' || p.status === 'done').length;
      const correct = attempts.filter((a: any) => a.is_correct).length;
      const accuracy = attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : 0;
      setStats({ chapters: chapters.length, done, mcqs: attempts.length, accuracy, videos: videos.length, tests: 0 });
    }).finally(() => setLoading(false));
  }, [subject, user]);

  const pct = stats.chapters > 0 ? Math.round((stats.done / stats.chapters) * 100) : 0;

  // 1. Chapter Roadmap
  // 2. Video Lecture
  // 3. Practice MCQs & Mock Tests
  // 4. All PDF & Study Material
  // 5. Doubts Forum
  // 6. Past Paper Analysis
  const verticalSections = [
    {
      id: 'tracker',
      icon: CheckSquare,
      emoji: '🗺️',
      title: 'Chapter Roadmap',
      subtitle: `${stats.done}/${stats.chapters} chapters completed · Sequential journey`,
      badge: `${pct}% Done`,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-green-200/50',
    },
    {
      id: 'videos',
      icon: Video,
      emoji: '🎬',
      title: 'Video Lectures',
      subtitle: `${stats.videos || '12+'} lectures · Arranged by chapter & Creator filter`,
      badge: `${stats.videos || 12} Videos`,
      gradient: 'from-rose-500 to-pink-600',
      shadow: 'shadow-rose-200/50',
    },
    {
      id: 'practice',
      icon: Target,
      emoji: '🎯',
      title: 'Practice MCQs & Mock Tests',
      subtitle: 'Chapter-wise MCQs + Chapter, Unit & Full Subject Mock Tests',
      badge: 'MCQs & Tests',
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-200/50',
    },
    {
      id: 'notes',
      icon: BookOpen,
      emoji: '📚',
      title: 'All PDF & Study Material',
      subtitle: 'Book PDFs, Guidebooks, Solution Notes & Formula Sheets',
      badge: 'All PDF',
      gradient: 'from-teal-500 to-cyan-600',
      shadow: 'shadow-teal-200/50',
    },
    {
      id: 'doubts',
      icon: MessageCircle,
      emoji: '💬',
      title: 'Doubts Forum',
      subtitle: `Grade ${profile?.grade || 10} ${subject} doubts · Ask & answer discussions`,
      badge: 'Community',
      gradient: 'from-fuchsia-500 to-pink-600',
      shadow: 'shadow-fuchsia-200/50',
    },
    {
      id: 'ppa',
      icon: BarChart3,
      emoji: '📊',
      title: 'Past Paper Analysis',
      subtitle: 'Topic-wise grid & Question-wise columns with solved answers',
      badge: 'NEB Data',
      gradient: 'from-purple-500 to-violet-600',
      shadow: 'shadow-purple-200/50',
    },
  ];

  return (
    <div className="px-4 pt-4 pb-6 space-y-4 max-w-lg mx-auto">
      {/* ── Subject Horizontal Progress Card ── */}
      <GlassCard className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-200 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-emerald-800 text-xs font-bold uppercase tracking-wider">Overall Progress</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-emerald-950">{pct}%</span>
              <span className="text-xs text-emerald-700 font-medium">syllabus covered</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-300">
            {pct}%
          </div>
        </div>

        {/* Animated Horizontal Progress Bar */}
        <div className="h-2.5 bg-emerald-200/80 rounded-full overflow-hidden my-2.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-full bg-emerald-600 rounded-full"
          />
        </div>

        {/* Progress Metrics Row */}
        <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
          <div className="bg-white/80 rounded-xl p-2 border border-emerald-100">
            <p className="font-black text-emerald-900 text-xs">{stats.chapters}</p>
            <p className="text-[10px] text-emerald-700">Chapters</p>
          </div>
          <div className="bg-white/80 rounded-xl p-2 border border-emerald-100">
            <p className="font-black text-emerald-900 text-xs">{stats.done}</p>
            <p className="text-[10px] text-emerald-700">Completed</p>
          </div>
          <div className="bg-white/80 rounded-xl p-2 border border-emerald-100">
            <p className="font-black text-emerald-900 text-xs">{stats.mcqs}</p>
            <p className="text-[10px] text-emerald-700">MCQs Done</p>
          </div>
          <div className="bg-white/80 rounded-xl p-2 border border-emerald-100">
            <p className="font-black text-emerald-900 text-xs">{stats.accuracy}%</p>
            <p className="text-[10px] text-emerald-700">Accuracy</p>
          </div>
        </div>
      </GlassCard>

      {/* ── Vertical List of Subject Sections (Arranged strictly in requested order) ── */}
      <div>
        <h3 className="font-black text-gray-900 text-sm mb-3 px-1">Study Material & Tools</h3>
        <div className="space-y-3">
          {verticalSections.map((sec, i) => {
            const Icon = sec.icon;
            return (
              <motion.div
                key={sec.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard
                  hover
                  onClick={() => onGoTo(sec.id)}
                  className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${sec.gradient} rounded-2xl flex items-center justify-center text-white text-xl shadow-md ${sec.shadow} group-hover:scale-105 transition-transform flex-shrink-0`}>
                      <Icon size={22} className="text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{sec.title}</p>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r ${sec.gradient} text-white`}>
                          {sec.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{sec.subtitle}</p>
                    </div>

                    <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PRACTICE & MOCK TEST COMBINED SECTION (Practice Chapter-wise + 3 Types Mock Tests)
// ════════════════════════════════════════════════════════════════════════════
function PracticeAndMockSection({ subject, defaultMode = 'practice' }: { subject: string; defaultMode?: 'practice' | 'mock' }) {
  const { user } = useAuth();
  const { awardXP } = useXP();
  const [hubTab, setHubTab] = useState<'practice' | 'mock'>(defaultMode);

  const [chapters, setChapters] = useState<any[]>([]);
  const [mode, setMode] = useState<'menu' | 'chapterwise' | 'random' | 'quiz' | 'result'>('menu');
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  // Mock Test State (3 types: Chapter, Unit, Full Subject)
  const [mockType, setMockType] = useState<'chapter' | 'unit' | 'full'>('chapter');
  const [mockTimeLeft, setMockTimeLeft] = useState(0);
  const [mockAnswers, setMockAnswers] = useState<Record<number, number>>({});
  const [mockResult, setMockResult] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/chapters?subject=${encodeURIComponent(subject)}`).then(r => r.json()).then(setChapters).catch(() => {});
  }, [subject]);

  const startQuiz = async (url: string) => {
    setLoading(true);
    try {
      const data = await fetch(url).then(r => r.json());
      if (!Array.isArray(data) || !data.length) { alert('No questions available yet for this selection.'); setLoading(false); return; }
      setQuestions(data); setCurrentQ(0); setScore({ correct: 0, total: 0 });
      setSelectedAnswer(null); setAnswered(false); setMode('quiz');
    } finally { setLoading(false); }
  };

  const startMockTest = async () => {
    setLoading(true);
    const configs = {
      chapter: { q: 15, m: 25 },
      unit:    { q: 25, m: 45 },
      full:    { q: 50, m: 90 },
    };
    const cfg = configs[mockType];
    try {
      let url = `/api/questions?subject=${encodeURIComponent(subject)}&limit=${cfg.q}`;
      if (mockType === 'chapter' && selectedChapter) url = `/api/questions?chapter_id=${selectedChapter.id || selectedChapter}&limit=${cfg.q}`;
      const data = await fetch(url).then(r => r.json());
      if (!data.length) { alert('No questions available for this mock test.'); return; }
      setQuestions(data); setMockAnswers({}); setCurrentQ(0); setMockTimeLeft(cfg.m * 60); setMode('quiz');
    } finally { setLoading(false); }
  };

  const handleAnswer = async (idx: number) => {
    if (answered) return;
    setSelectedAnswer(idx); setAnswered(true);
    const q = questions[currentQ];
    const correct = idx === q.correct_answer;
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    if (user) {
      fetch('/api/question-attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, question_id: q.id, selected_answer: idx, is_correct: correct }) }).catch(() => {});
      if (correct) await awardXP(5, 'correct_mcq');
      if (selectedChapter) fetch('/api/chapter-progress/auto', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, chapter_id: selectedChapter.id, subject }) }).catch(() => {});
    }
  };

  const next = () => {
    if (currentQ < questions.length - 1) { setCurrentQ(c => c + 1); setSelectedAnswer(null); setAnswered(false); }
    else setMode('result');
  };

  const q = questions[currentQ];

  if (mode === 'quiz' && q) return (
    <div className="px-4 pt-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setMode('menu')} className="flex items-center gap-1 text-sm text-gray-500"><ChevronLeft size={15} /> Exit</button>
        <span className="text-sm text-gray-500 font-medium">{currentQ + 1} / {questions.length}</span>
        <span className="text-sm font-bold text-green-600">{score.correct} ✓</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full mb-4 overflow-hidden">
        <motion.div className="h-full bg-blue-600 rounded-full" animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={currentQ} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}>
          <GlassCard className="p-4 mb-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {q.difficulty && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{q.difficulty}</span>}
              {q.year_asked && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{q.year_asked}</span>}
            </div>
            <p className="text-gray-800 font-semibold leading-relaxed text-sm">{q.question_text}</p>
          </GlassCard>
          <div className="space-y-2.5 mb-4">
            {(q.options || []).map((opt: string, idx: number) => {
              let cls = 'bg-white border-gray-200 text-gray-700';
              if (answered) { if (idx === q.correct_answer) cls = 'bg-green-50 border-green-400 text-green-800'; else if (idx === selectedAnswer) cls = 'bg-red-50 border-red-400 text-red-800'; }
              return (
                <motion.button key={idx} whileTap={!answered ? { scale: 0.98 } : undefined} onClick={() => handleAnswer(idx)}
                  className={`w-full border-2 rounded-2xl p-3.5 text-left flex items-center gap-3 transition-all ${cls}`}>
                  <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {answered && idx === q.correct_answer ? <Check size={13} /> : answered && idx === selectedAnswer ? <X size={13} /> : String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm font-medium">{opt}</span>
                </motion.button>
              );
            })}
          </div>
          {answered && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {q.explanation && (
                <GlassCard className="p-3.5 mb-3 bg-blue-50/60 border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Lightbulb size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700 leading-relaxed">{q.explanation}</p>
                  </div>
                </GlassCard>
              )}
              <motion.button whileTap={{ scale: 0.97 }} onClick={next}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                {currentQ < questions.length - 1 ? <><span>Next Question</span><ChevronRight size={16} /></> : '🏁 See Results'}
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  if (mode === 'result') {
    const pct = Math.round((score.correct / score.total) * 100);
    return (
      <div className="px-4 pt-8 flex flex-col items-center max-w-lg mx-auto">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4 }} className="text-7xl mb-5">
          {pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '💪'}
        </motion.div>
        <h2 className="text-4xl font-black text-gray-800 mb-1">{pct}%</h2>
        <p className="text-gray-500 text-sm mb-2">{score.correct} correct out of {score.total}</p>
        <p className="text-amber-600 text-sm font-bold mb-8">+{score.correct * 5} XP earned!</p>
        <div className="w-full space-y-3">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setMode('menu')} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200">Practice Again</motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 space-y-4 max-w-lg mx-auto">
      {/* Hub Tabs: Practice vs Mock Test */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        <button
          onClick={() => setHubTab('practice')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            hubTab === 'practice' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600'
          }`}
        >
          <Target size={14} /> Practice Chapter-wise
        </button>
        <button
          onClick={() => setHubTab('mock')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            hubTab === 'mock' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-gray-600'
          }`}
        >
          <Award size={14} /> Mock Tests (3 Types)
        </button>
      </div>

      {hubTab === 'practice' ? (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Practice MCQs Chapter-Wise</p>
          <div className="space-y-2">
            {chapters.map((ch: any) => (
              <motion.button key={ch.id} whileTap={{ scale: 0.97 }}
                onClick={() => { setSelectedChapter(ch); startQuiz(`/api/questions?chapter_id=${ch.id}&limit=10`); }}
                className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-left flex items-center gap-3 hover:border-blue-300 transition-all shadow-sm">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-black text-sm flex-shrink-0">{ch.chapter_number}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm">{ch.title}</p>
                  {ch.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{ch.description}</p>}
                </div>
                <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        /* MOCK TEST MODE (3 Types: Chapter, Unit, Full Subject) */
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Mock Test Type</p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'chapter' as const, emoji: '📖', label: 'Chapter Test', desc: '15 Qs · 25m' },
              { id: 'unit' as const,    emoji: '📚', label: 'Unit Test',    desc: '25 Qs · 45m' },
              { id: 'full' as const,    emoji: '🎯', label: 'Full Exam',    desc: '50 Qs · 90m' },
            ].map(mt => (
              <motion.button
                key={mt.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMockType(mt.id)}
                className={`p-3 rounded-2xl border-2 text-center transition-all ${
                  mockType === mt.id ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-gray-200 bg-white'
                }`}
              >
                <span className="text-2xl block mb-1">{mt.emoji}</span>
                <p className={`text-xs font-black ${mockType === mt.id ? 'text-amber-900' : 'text-gray-800'}`}>{mt.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{mt.desc}</p>
              </motion.button>
            ))}
          </div>

          {mockType === 'chapter' && chapters.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Select Chapter for Test</label>
              <select value={selectedChapter?.id || ''} onChange={e => setSelectedChapter(chapters.find(c => String(c.id) === e.target.value))}
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 appearance-none shadow-sm">
                <option value="">Select a chapter…</option>
                {chapters.map((c: any) => <option key={c.id} value={c.id}>{c.chapter_number}. {c.title}</option>)}
              </select>
            </div>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={startMockTest} disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-4 rounded-2xl shadow-lg shadow-amber-200 flex items-center justify-center gap-2 text-sm">
            {loading ? <LoadingSpinner size="sm" /> : <><Award size={18} /> Start {mockType.toUpperCase()} Mock Test</>}
          </motion.button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIDEOS SECTION
// ════════════════════════════════════════════════════════════════════════════
function VideosSection({ subject }: { subject: string }) {
  const [searchParams] = useSearchParams();
  const initialChapterId = searchParams.get('chapter_id') || searchParams.get('chapter') || 'all';

  const [chapters, setChapters] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<any | null>(null);

  const [selectedChapterId, setSelectedChapterId] = useState<string>(initialChapterId);
  const [selectedCreator, setSelectedCreator] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      fetch(`/api/chapters?subject=${encodeURIComponent(subject)}`).then(r => r.json()),
      fetch(`/api/videos?subject=${encodeURIComponent(subject)}`).then(r => r.json()),
    ]).then(([chRes, vidRes]) => {
      if (chRes.status === 'fulfilled') setChapters(Array.isArray(chRes.value) ? chRes.value : []);
      if (vidRes.status === 'fulfilled') setVideos(Array.isArray(vidRes.value) ? vidRes.value : []);
    }).finally(() => setLoading(false));
  }, [subject]);

  const allCreators = Array.from(new Set(videos.map(v => v.creator_name || v.channel_name).filter(Boolean)));
  const DEFAULT_CREATORS = ['NEB Online Class', 'Science Guru Nepal', 'Physics Nepal', 'EduNepal Academy', 'SEE Gurukul', 'Maths Mastery Nepal'];
  const creatorOptions = Array.from(new Set([...DEFAULT_CREATORS, ...allCreators]));

  const filteredVideos = videos.filter(v => {
    const matchCreator = selectedCreator === 'all' || (v.creator_name || v.channel_name || '').toLowerCase() === selectedCreator.toLowerCase();
    const matchChapter = selectedChapterId === 'all' || String(v.chapter_id) === String(selectedChapterId) || (v.chapter_title && v.chapter_title.toLowerCase().includes(selectedChapterId.toLowerCase()));
    return matchCreator && matchChapter;
  });

  const chapterGroupMap: Record<string, { chapter_id: number; chapter_number: number; chapter_title: string; videos: any[] }> = {};

  chapters.forEach(ch => {
    chapterGroupMap[ch.title] = {
      chapter_id: ch.id,
      chapter_number: ch.chapter_number,
      chapter_title: ch.title,
      videos: [],
    };
  });

  filteredVideos.forEach(v => {
    const chTitle = v.chapter_title;
    if (chTitle && chapterGroupMap[chTitle]) {
      chapterGroupMap[chTitle].videos.push(v);
    } else {
      const matchedKey = Object.keys(chapterGroupMap).find(k => k.toLowerCase().includes((chTitle || '').toLowerCase()));
      if (matchedKey) {
        chapterGroupMap[matchedKey].videos.push(v);
      } else {
        const fallbackTitle = chTitle || 'General Chapter Lectures';
        if (!chapterGroupMap[fallbackTitle]) {
          chapterGroupMap[fallbackTitle] = { chapter_id: 0, chapter_number: 0, chapter_title: fallbackTitle, videos: [] };
        }
        chapterGroupMap[fallbackTitle].videos.push(v);
      }
    }
  });

  const activeGroups = Object.values(chapterGroupMap).filter(g => g.videos.length > 0);

  return (
    <div className="px-4 pt-4 space-y-5 max-w-lg mx-auto">
      {playing && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl overflow-hidden shadow-2xl shadow-rose-200 border border-rose-100 bg-white">
          <div className="aspect-video bg-black">
            <iframe src={`https://www.youtube.com/embed/${playing.youtube_id}?autoplay=1`} className="w-full h-full" allowFullScreen allow="autoplay" />
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <User size={10} /> {playing.creator_name || playing.channel_name || 'NEB Teacher'}
              </span>
              {playing.chapter_title && <span className="text-xs text-gray-400">· {playing.chapter_title}</span>}
            </div>
            <p className="font-bold text-gray-900 text-sm leading-snug">{playing.title}</p>
            <button onClick={() => setPlaying(null)} className="mt-2 text-xs text-rose-600 font-bold hover:underline">
              ✕ Close Video Player
            </button>
          </div>
        </motion.div>
      )}

      {/* Chapter Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <BookOpen size={14} className="text-rose-600" />
            <h3 className="font-black text-gray-900 text-xs">Filter Chapter</h3>
          </div>
          {selectedChapterId !== 'all' && (
            <button onClick={() => setSelectedChapterId('all')} className="text-xs text-rose-600 font-bold hover:underline">
              All Chapters
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide">
          <button
            onClick={() => setSelectedChapterId('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              selectedChapterId === 'all' ? 'bg-rose-600 text-white shadow-md shadow-rose-200' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            📚 All Chapters ({chapters.length})
          </button>

          {chapters.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChapterId(String(ch.id))}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                String(selectedChapterId) === String(ch.id) ? 'bg-rose-600 text-white shadow-md shadow-rose-200' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Ch. {ch.chapter_number}: {ch.title}
            </button>
          ))}
        </div>
      </div>

      {/* Creator Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-rose-600" />
            <h3 className="font-black text-gray-900 text-xs">Filter Creator / Teacher</h3>
          </div>
          {selectedCreator !== 'all' && (
            <button onClick={() => setSelectedCreator('all')} className="text-xs text-rose-600 font-bold hover:underline">
              All Teachers
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedCreator('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              selectedCreator === 'all' ? 'bg-rose-600 text-white shadow-md shadow-rose-200' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            🎬 All Creators ({videos.length})
          </button>

          {creatorOptions.map(creator => {
            const count = videos.filter(v => (v.creator_name || v.channel_name || '').toLowerCase() === creator.toLowerCase()).length;
            return (
              <button
                key={creator}
                onClick={() => setSelectedCreator(creator)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1.5 ${
                  selectedCreator === creator ? 'bg-rose-600 text-white shadow-md shadow-rose-200' : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                <User size={11} />
                <span>{creator}</span>
                {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? <LoadingSpinner size="lg" text="Loading video lectures..." /> : (
        <div className="space-y-6">
          {activeGroups.map(group => (
            <div key={group.chapter_title} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <span className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center">
                  {group.chapter_number || '•'}
                </span>
                <h3 className="font-black text-gray-900 text-sm flex-1">{group.chapter_title}</h3>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                  {group.videos.length} lecture{group.videos.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-2.5">
                {group.videos.map((v: any) => (
                  <VideoCard key={v.id} video={v} onPlay={() => setPlaying(v)} />
                ))}
              </div>
            </div>
          ))}

          {activeGroups.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🎬</div>
              <p className="font-bold text-gray-800 mb-1">No video lectures found</p>
              <p className="text-gray-400 text-sm mb-4">No videos match the selected filters.</p>
              <button
                onClick={() => { setSelectedCreator('all'); setSelectedChapterId('all'); }}
                className="bg-rose-600 text-white font-bold px-6 py-2.5 rounded-2xl text-xs shadow-md shadow-rose-200"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VideoCard({ video, onPlay }: { video: any; onPlay: () => void }) {
  const creator = video.creator_name || video.channel_name || 'NEB Teacher';

  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onPlay}
      className="w-full bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all text-left flex gap-3 p-3 cursor-pointer">
      <div className="relative w-28 h-18 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100" style={{ height: 72 }}>
        {video.youtube_id && <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} alt={video.title} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="w-9 h-9 bg-white/95 rounded-full flex items-center justify-center shadow-lg">
            <Play size={14} className="text-rose-600 ml-0.5" />
          </div>
        </div>
        {video.duration && <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-medium">{video.duration}</div>}
      </div>

      <div className="flex-1 min-w-0 py-0.5">
        <p className="font-bold text-gray-800 text-sm leading-snug line-clamp-2">{video.title}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
            <User size={10} /> {creator}
          </span>
          {video.views && <span className="text-[11px] text-gray-400 flex items-center gap-1"><Eye size={10} /> {video.views}</span>}
        </div>
      </div>
    </motion.button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAST PAPER ANALYSIS
// ════════════════════════════════════════════════════════════════════════════
function PPASection({ subject }: { subject: string }) {
  return <PastPaperAnalysisGrid subjectName={subject} />;
}

// ════════════════════════════════════════════════════════════════════════════
// ALL PDF & STUDY MATERIAL (Book PDF, Guidebook, Formula Sheet filter)
// ════════════════════════════════════════════════════════════════════════════
function NotesSection({ subject }: { subject: string }) {
  const [activeTab, setActiveTab] = useState<'all' | 'book' | 'guide' | 'formula'>('all');
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [showReader, setShowReader] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/notes?subject=${encodeURIComponent(subject)}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d) && d.length > 0) {
          setNotes(d);
        } else {
          setNotes([
            {
              id: 101,
              title: `${subject} — Official CDC Textbook (Complete PDF)`,
              subject_name: subject,
              grade: 10,
              content: `# ${subject} — Official CDC Nepal Textbook PDF\n\nComplete e-book edition published by Curriculum Development Centre (CDC), Sanothimi, Bhaktapur.`,
            },
            {
              id: 102,
              title: `${subject} — Model Question Solutions & Guide Book`,
              subject_name: subject,
              grade: 10,
              content: `# ${subject} — Solution Guidebook\n\nDetailed chapter-wise solved questions, model answers, and NEB board marking scheme.`,
            },
            {
              id: 103,
              title: `${subject} — Quick Formula & Revision Sheet`,
              subject_name: subject,
              grade: 10,
              content: `# ${subject} — Essential Formula & Revision Sheet\n\nAll key formulas, equations, definitions, and theorems summarized for quick revision.`,
            },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subject]);

  const pdfCategories = [
    { id: 'all' as const,     emoji: '📚', label: 'All PDF' },
    { id: 'book' as const,    emoji: '📖', label: 'Book PDF' },
    { id: 'guide' as const,   emoji: '📕', label: 'Guide Book' },
    { id: 'formula' as const, emoji: '⚡', label: 'Formula Sheet' },
  ];

  const handleOpenNote = (note: NoteItem) => {
    setSelectedNote(note);
    setShowReader(true);
  };

  const handleDownloadNote = (note: NoteItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const header = `========================================================\nPADHAINEPAL — ${note.title.toUpperCase()}\nSubject: ${note.subject_name}\n========================================================\n\n`;
      const fullText = header + note.content.replace(/#+\s/g, '').replace(/\*\*/g, '');
      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}_Material.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div className="px-4 pt-4 space-y-4 max-w-lg mx-auto">
      {/* Category Pills Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {pdfCategories.map((cat) => (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.94 }}
            onClick={() => setActiveTab(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === cat.id
                ? 'bg-teal-600 text-white shadow-md shadow-teal-200'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </motion.button>
        ))}
      </div>

      {loading ? <LoadingSpinner size="lg" text="Loading study materials..." /> : (
        <div className="space-y-3">
          {notes.map((note, i) => (
            <motion.div key={note.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard hover onClick={() => handleOpenNote(note)} className="p-4 flex items-center gap-3 cursor-pointer">
                <div className="w-11 h-11 bg-teal-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{note.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full">{subject}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">CDC Verified PDF</span>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleOpenNote(note)} className="w-9 h-9 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center font-bold text-xs">
                    <Eye size={15} />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => handleDownloadNote(note, e)} className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-sm">
                    <Download size={15} />
                  </motion.button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <GlassCard className="p-4 bg-teal-50/50 border border-teal-200 text-center">
        <p className="text-teal-700 text-sm font-semibold">📚 Tap any PDF to read online or download!</p>
        <p className="text-teal-600 text-xs mt-1">Includes CDC Textbooks, Guidebooks & Formula Sheets.</p>
      </GlassCard>

      {/* Note Reader Modal */}
      <NoteReaderModal
        note={selectedNote}
        isOpen={showReader}
        onClose={() => setShowReader(false)}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DOUBTS SECTION (Filtered by Grade & Selected Subject)
// ════════════════════════════════════════════════════════════════════════════
function DoubtsSection({ subject }: { subject: string }) {
  const { user, profile } = useAuth();
  const [doubts, setDoubts] = useState<any[]>([]);
  const [myDoubts, setMyDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ask' | 'recent' | 'mine'>('recent');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);

  const fetchDoubts = useCallback(async () => {
    setLoading(true);
    try {
      const [all, mine] = await Promise.all([
        fetch(`/api/doubts?subject=${encodeURIComponent(subject)}&limit=15`).then(r => r.json()),
        user ? fetch(`/api/doubts?subject=${encodeURIComponent(subject)}&user_id=${user.id}`).then(r => r.json()) : Promise.resolve([]),
      ]);
      setDoubts(Array.isArray(all) ? all : []);
      setMyDoubts(Array.isArray(mine) ? mine : []);
    } finally { setLoading(false); }
  }, [subject, user]);

  useEffect(() => { fetchDoubts(); }, [fetchDoubts]);

  const post = async () => {
    if (!title.trim() || !user) return;
    setPosting(true);
    await fetch('/api/doubts', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, user_name: profile?.full_name || 'Student', title, body, subject }) }).catch(() => {});
    setTitle(''); setBody(''); setPosted(true); setPosting(false);
    setTimeout(() => { setPosted(false); setActiveTab('mine'); }, 1500);
    fetchDoubts();
  };

  const timeAgo = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 1) return 'just now'; if (m < 60) return `${m}m`; const h = Math.floor(m / 60); if (h < 24) return `${h}h`; return `${Math.floor(h / 24)}d`; };

  const tabConfig = [
    { id: 'ask' as const,    emoji: '✏️', label: 'Ask Doubt'        },
    { id: 'recent' as const, emoji: '💬', label: `Grade ${profile?.grade || 10} Doubts` },
    { id: 'mine' as const,   emoji: '👤', label: `My Doubts (${myDoubts.length})` },
  ];

  const renderDoubtCard = (d: any) => (
    <GlassCard key={d.id} className="p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-gray-800 text-sm leading-snug flex-1">{d.title}</p>
        <span className="text-xs text-gray-300 flex-shrink-0">{timeAgo(d.created_at)}</span>
      </div>
      {d.body && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{d.body}</p>}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 flex items-center gap-1"><Users size={10} />{d.user_name}</span>
        <span className="text-xs text-gray-400 flex items-center gap-1"><MessageCircle size={10} />{d.reply_count || 0} answers</span>
        <span className="text-xs text-gray-400 flex items-center gap-1"><ThumbsUp size={10} />{d.upvotes || 0}</span>
      </div>
    </GlassCard>
  );

  return (
    <div className="px-4 pt-4 space-y-4 max-w-lg mx-auto">
      <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-2xl p-3 text-xs text-fuchsia-800 font-medium">
        📌 Showing doubts for Grade {profile?.grade || 10} · {subject}
      </div>

      {/* Tab selector */}
      <div className="grid grid-cols-3 gap-2">
        {tabConfig.map(t => (
          <motion.button key={t.id} whileTap={{ scale: 0.94 }} onClick={() => setActiveTab(t.id)}
            className={`p-3 rounded-2xl border-2 text-center transition-all ${activeTab === t.id ? 'border-fuchsia-500 bg-fuchsia-50 shadow-xs' : 'border-gray-200 bg-white'}`}>
            <span className="text-xl block mb-1">{t.emoji}</span>
            <p className={`text-xs font-bold ${activeTab === t.id ? 'text-fuchsia-700' : 'text-gray-700'}`}>{t.label}</p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'ask' && (
          <motion.div key="ask" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {posted ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">✅</div>
                <p className="font-bold text-gray-800">Doubt posted!</p>
                <p className="text-gray-400 text-sm mt-1">Your classmates in Grade {profile?.grade || 10} will answer soon.</p>
              </div>
            ) : (
              <GlassCard className="p-4 space-y-3">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What's your question about?"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-fuchsia-400" />
                <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Explain in more detail (optional)..." rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-fuchsia-400 resize-none" />
                <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-3">
                  <p className="text-xs text-fuchsia-700">📌 Grade {profile?.grade || 10} · <strong>{subject}</strong></p>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={post} disabled={posting || !title.trim()}
                  className="w-full bg-fuchsia-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-fuchsia-200 disabled:opacity-40 flex items-center justify-center gap-2">
                  {posting ? 'Posting...' : <><HelpCircle size={18} /> Post My Doubt</>}
                </motion.button>
              </GlassCard>
            )}
          </motion.div>
        )}

        {activeTab === 'recent' && (
          <motion.div key="recent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {loading ? <LoadingSpinner size="lg" /> : doubts.length > 0 ? doubts.map(renderDoubtCard) : (
              <div className="text-center py-12">
                <MessageCircle size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No doubts for Grade {profile?.grade || 10} {subject} yet.</p>
                <button onClick={() => setActiveTab('ask')} className="text-fuchsia-600 text-sm font-semibold mt-2">Ask the first one →</button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'mine' && (
          <motion.div key="mine" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {myDoubts.length > 0 ? myDoubts.map(renderDoubtCard) : (
              <div className="text-center py-12">
                <HelpCircle size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">You haven't asked any doubts yet.</p>
                <button onClick={() => setActiveTab('ask')} className="text-fuchsia-600 text-sm font-semibold mt-2">Ask your first doubt →</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThumbsUp({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>; }
