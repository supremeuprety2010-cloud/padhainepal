import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, BookOpen, Target, Clock, ChevronRight, Check, X,
  Lightbulb, ChevronLeft, AlertCircle, BarChart3, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useXP } from '../../hooks/useXP';
import AppHeader from '../../components/AppHeader';
import GlassCard from '../../components/GlassCard';
import LoadingSpinner from '../../components/LoadingSpinner';

type PracticeTab = 'quick' | 'past' | 'mock' | 'attempts';
type MockMode = 'chapter' | 'subject' | 'full';

export default function PracticeHub() {
  const { user, profile } = useAuth();
  const { awardXP } = useXP();
  const [tab, setTab] = useState<PracticeTab>('quick');

  const tabConfig = [
    { id: 'quick' as PracticeTab,    label: 'Quick',    icon: Zap },
    { id: 'past' as PracticeTab,     label: 'PYQ',      icon: BookOpen },
    { id: 'mock' as PracticeTab,     label: 'Mock',     icon: Target },
    { id: 'attempts' as PracticeTab, label: 'History',  icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <AppHeader title="Practice" showActions={false} />
      <div className="pt-14">
        {/* Tab bar */}
        <div className="px-4 pt-3 pb-0">
          <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
            {tabConfig.map(({ id, label, icon: Icon }) => (
              <motion.button key={id} whileTap={{ scale: 0.95 }} onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  tab === id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                }`}>
                <Icon size={13} /> {label}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="px-4 pt-4">
          {tab === 'quick'    && <QuickPractice user={user} profile={profile} awardXP={awardXP} />}
          {tab === 'past'     && <PastQuestions user={user} profile={profile} awardXP={awardXP} />}
          {tab === 'mock'     && <MockTests user={user} profile={profile} awardXP={awardXP} />}
          {tab === 'attempts' && <MyAttempts user={user} />}
        </div>
      </div>
    </div>
  );
}

// ── Quick Practice ─────────────────────────────────────────────────────────────
function QuickPractice({ user, profile, awardXP }: any) {
  const [subjects] = useState<string[]>(profile?.subjects || []);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [phase, setPhase] = useState<'select' | 'quiz' | 'result'>('select');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSubject) {
      fetch(`/api/chapters?subject=${encodeURIComponent(selectedSubject)}`).then(r => r.json()).then(setChapters).catch(() => {});
    }
  }, [selectedSubject]);

  const start = async () => {
    setLoading(true);
    try {
      let url = selectedSubject
        ? `/api/questions?subject=${encodeURIComponent(selectedSubject)}&limit=10`
        : `/api/questions?limit=10`;
      if (selectedChapter) url = `/api/questions?chapter_id=${selectedChapter}&limit=10`;
      const data = await fetch(url).then(r => r.json());
      if (!data.length) { alert('No questions found. Try a different selection.'); return; }
      setQuestions(data); setCurrentQ(0); setScore({ correct: 0, total: 0 });
      setSelectedAnswer(null); setAnswered(false); setPhase('quiz');
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
    }
  };

  const next = () => {
    if (currentQ < questions.length - 1) { setCurrentQ(c => c + 1); setSelectedAnswer(null); setAnswered(false); }
    else setPhase('result');
  };

  const q = questions[currentQ];

  if (phase === 'select') return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-gray-600 mb-2 block">Subject</label>
        <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedChapter(''); }}
          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-400 appearance-none shadow-sm">
          <option value="">All subjects</option>
          {subjects.map((s: string) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {chapters.length > 0 && (
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-2 block">Chapter (optional)</label>
          <select value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-400 appearance-none shadow-sm">
            <option value="">All chapters</option>
            {chapters.map((c: any) => <option key={c.id} value={c.id}>{c.chapter_number}. {c.title}</option>)}
          </select>
        </div>
      )}
      <motion.button whileTap={{ scale: 0.97 }} onClick={start} disabled={loading}
        className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-40">
        {loading ? <LoadingSpinner size="sm" /> : <><Zap size={18} /> Start Practice</>}
      </motion.button>
    </div>
  );

  if (phase === 'result') {
    const pct = Math.round((score.correct / score.total) * 100);
    return (
      <div className="flex flex-col items-center pt-8">
        <div className="text-6xl mb-4">{pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '💪'}</div>
        <p className="text-3xl font-black text-gray-800 mb-1">{pct}%</p>
        <p className="text-gray-500 text-sm mb-8">{score.correct}/{score.total} correct · +{score.correct * 5} XP earned</p>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setPhase('select'); setQuestions([]); }}
          className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl">Practice Again</motion.button>
      </div>
    );
  }

  if (!q) return <LoadingSpinner size="lg" />;
  return <QuizView q={q} currentQ={currentQ} total={questions.length} score={score} selectedAnswer={selectedAnswer} answered={answered} onAnswer={handleAnswer} onNext={next} />;
}

// ── Past Questions (PYQ) ───────────────────────────────────────────────────────
function PastQuestions({ user, profile, awardXP }: any) {
  const [subjects] = useState<string[]>(profile?.subjects || []);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [year, setYear] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [phase, setPhase] = useState<'select' | 'quiz' | 'result'>('select');
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    try {
      let url = `/api/questions?limit=15&year_only=true`;
      if (selectedSubject) url += `&subject=${encodeURIComponent(selectedSubject)}`;
      if (year) url += `&year=${year}`;
      const data = await fetch(url).then(r => r.json());
      if (!data.length) { alert('No past questions found. Try different filters.'); return; }
      setQuestions(data); setCurrentQ(0); setScore({ correct: 0, total: 0 });
      setSelectedAnswer(null); setAnswered(false); setPhase('quiz');
    } finally { setLoading(false); }
  };

  const handleAnswer = async (idx: number) => {
    if (answered) return;
    setSelectedAnswer(idx); setAnswered(true);
    const q = questions[currentQ];
    const correct = idx === q.correct_answer;
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    if (user && correct) await awardXP(5, 'pyq_correct');
  };

  const next = () => {
    if (currentQ < questions.length - 1) { setCurrentQ(c => c + 1); setSelectedAnswer(null); setAnswered(false); }
    else setPhase('result');
  };

  const q = questions[currentQ];

  if (phase === 'select') return (
    <div className="space-y-4">
      <GlassCard className="p-3.5 bg-amber-50/50 border border-amber-200">
        <p className="text-xs text-amber-800">📜 Past Year Questions from actual NEB exams — practice what's been asked before.</p>
      </GlassCard>
      <div>
        <label className="text-sm font-semibold text-gray-600 mb-2 block">Subject</label>
        <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-400 appearance-none shadow-sm">
          <option value="">All subjects</option>
          {subjects.map((s: string) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-600 mb-2 block">Year (optional)</label>
        <select value={year} onChange={e => setYear(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-400 appearance-none shadow-sm">
          <option value="">Any year</option>
          {[2023, 2022, 2021, 2020, 2019].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={start} disabled={loading}
        className="w-full bg-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-200 flex items-center justify-center gap-2 disabled:opacity-40">
        {loading ? <LoadingSpinner size="sm" /> : '📜 Start PYQ Practice'}
      </motion.button>
    </div>
  );

  if (phase === 'result') {
    const pct = Math.round((score.correct / score.total) * 100);
    return (
      <div className="flex flex-col items-center pt-8">
        <div className="text-6xl mb-4">{pct >= 80 ? '🏆' : '💪'}</div>
        <p className="text-3xl font-black text-gray-800 mb-1">{pct}%</p>
        <p className="text-gray-500 text-sm mb-8">{score.correct}/{score.total} correct</p>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setPhase('select'); setQuestions([]); }}
          className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-2xl">Try Again</motion.button>
      </div>
    );
  }

  if (!q) return <LoadingSpinner size="lg" />;
  return <QuizView q={q} currentQ={currentQ} total={questions.length} score={score} selectedAnswer={selectedAnswer} answered={answered} onAnswer={handleAnswer} onNext={next} accentColor="bg-amber-500" />;
}

// ── Mock Tests ─────────────────────────────────────────────────────────────────
function MockTests({ user, profile, awardXP }: any) {
  const [mode, setMode] = useState<MockMode>('subject');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [phase, setPhase] = useState<'setup' | 'test' | 'result'>('setup');
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (selectedSubject) {
      fetch(`/api/chapters?subject=${encodeURIComponent(selectedSubject)}`).then(r => r.json()).then(setChapters).catch(() => {});
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (phase === 'test' && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current!); submitTest(); return 0; } return t - 1; }), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const startTest = async () => {
    setLoading(true);
    try {
      const qCount = mode === 'full' ? 50 : mode === 'subject' ? 25 : 15;
      const mins = mode === 'full' ? 90 : mode === 'subject' ? 45 : 25;
      let url = `/api/questions?limit=${qCount}`;
      if (mode !== 'full' && selectedSubject) url += `&subject=${encodeURIComponent(selectedSubject)}`;
      if (mode === 'chapter' && selectedChapter) url += `&chapter_id=${selectedChapter}`;
      const data = await fetch(url).then(r => r.json());
      if (!data.length) { alert('No questions available.'); return; }
      setQuestions(data); setAnswers({}); setCurrentQ(0); setTimeLeft(mins * 60);
      startRef.current = Date.now(); setPhase('test');
    } finally { setLoading(false); }
  };

  const submitTest = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const taken = Math.round((Date.now() - startRef.current) / 1000);
    let correct = 0;
    const weak: Record<string, { c: number; t: number }> = {};
    questions.forEach((q, i) => {
      const ch = q.chapter_title || 'Unknown';
      if (!weak[ch]) weak[ch] = { c: 0, t: 0 };
      weak[ch].t++;
      if (answers[i] === q.correct_answer) { correct++; weak[ch].c++; }
    });
    const score = Math.round((correct / questions.length) * 100);
    const weakChapters = Object.entries(weak).filter(([, v]) => v.t > 0 && v.c / v.t < 0.5).map(([k]) => k);
    if (user) {
      fetch('/api/test-attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, mode, subject: selectedSubject, answers: Object.values(answers), score, time_taken: taken, total_questions: questions.length, correct_answers: correct }) }).catch(() => {});
      const xp = Math.round(score / 10) * 5;
      if (xp > 0) await awardXP(xp, 'mock_test');
    }
    setResult({ score, correct, total: questions.length, weak: weakChapters, timeTaken: taken });
    setPhase('result');
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (phase === 'setup') return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {([['chapter','📖','Chapter','15Q·25m'],['subject','📚','Subject','25Q·45m'],['full','🎯','Full','50Q·90m']] as const).map(([m, e, l, d]) => (
          <motion.button key={m} whileTap={{ scale: 0.95 }} onClick={() => setMode(m as MockMode)}
            className={`p-3 rounded-2xl border-2 text-center transition-all ${mode === m ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'}`}>
            <div className="text-2xl mb-1">{e}</div>
            <p className={`text-xs font-bold ${mode === m ? 'text-purple-700' : 'text-gray-700'}`}>{l}</p>
            <p className="text-xs text-gray-400">{d}</p>
          </motion.button>
        ))}
      </div>
      {mode !== 'full' && (
        <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-purple-400 appearance-none shadow-sm">
          <option value="">Select subject...</option>
          {(profile?.subjects || []).map((s: string) => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
      {mode === 'chapter' && chapters.length > 0 && (
        <select value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-purple-400 appearance-none shadow-sm">
          <option value="">Select chapter...</option>
          {chapters.map((c: any) => <option key={c.id} value={c.id}>{c.chapter_number}. {c.title}</option>)}
        </select>
      )}
      <GlassCard className="p-3.5 bg-amber-50/50 border border-amber-200">
        <div className="flex items-start gap-2"><AlertCircle size={14} className="text-amber-600 mt-0.5" /><p className="text-xs text-amber-800">Timer starts immediately. Auto-submits when time runs out.</p></div>
      </GlassCard>
      <motion.button whileTap={{ scale: 0.97 }} onClick={startTest} disabled={loading || (mode !== 'full' && !selectedSubject)}
        className="w-full bg-purple-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-200 disabled:opacity-40 flex items-center justify-center gap-2">
        {loading ? <LoadingSpinner size="sm" /> : '🚀 Start Mock Test'}
      </motion.button>
    </div>
  );

  if (phase === 'result' && result) return (
    <div className="space-y-4">
      <div className="text-center pt-4">
        <div className="text-5xl font-black mb-2" style={{ color: result.score >= 80 ? '#22c55e' : result.score >= 60 ? '#3b82f6' : '#f59e0b' }}>{result.score}%</div>
        <p className="text-gray-500 text-sm">{result.correct}/{result.total} correct · {fmt(result.timeTaken)}</p>
      </div>
      {result.weak.length > 0 && (
        <GlassCard className="p-4">
          <h3 className="font-bold text-gray-800 mb-2 text-sm flex items-center gap-1.5"><X size={14} className="text-red-500" /> Weak Chapters</h3>
          <div className="flex flex-wrap gap-1.5">{result.weak.map((ch: string) => <span key={ch} className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full">{ch}</span>)}</div>
        </GlassCard>
      )}
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setPhase('setup')} className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-2xl">Try Again</motion.button>
    </div>
  );

  const q = questions[currentQ];
  if (!q) return <LoadingSpinner size="lg" />;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{currentQ + 1}/{questions.length}</span>
        <div className={`flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5 ${timeLeft < 300 ? 'bg-red-100' : ''}`}>
          <Clock size={13} className={timeLeft < 300 ? 'text-red-500' : 'text-gray-500'} />
          <span className={`text-sm font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-700'}`}>{fmt(timeLeft)}</span>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={submitTest} className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">Submit</motion.button>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full mb-4">
        <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
      </div>
      <GlassCard className="p-4 mb-3"><p className="text-gray-800 font-semibold text-sm leading-relaxed">{q.question_text}</p></GlassCard>
      <div className="space-y-2.5 mb-4">
        {(q.options || []).map((opt: string, idx: number) => (
          <motion.button key={idx} whileTap={{ scale: 0.98 }} onClick={() => setAnswers(a => ({ ...a, [currentQ]: idx }))}
            className={`w-full border-2 rounded-2xl p-3.5 text-left flex items-center gap-3 transition-all ${answers[currentQ] === idx ? 'border-purple-500 bg-purple-50' : 'bg-white border-gray-200'}`}>
            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${answers[currentQ] === idx ? 'border-purple-500 bg-purple-500 text-white' : 'border-gray-300 text-gray-500'}`}>
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="text-sm font-medium text-gray-700">{opt}</span>
          </motion.button>
        ))}
      </div>
      <div className="flex gap-3">
        {currentQ > 0 && <motion.button whileTap={{ scale: 0.97 }} onClick={() => setCurrentQ(c => c - 1)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-1"><ChevronLeft size={16} /> Prev</motion.button>}
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => currentQ < questions.length - 1 ? setCurrentQ(c => c + 1) : submitTest()} className="flex-1 bg-purple-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-1">
          {currentQ < questions.length - 1 ? <><span>Next</span><ChevronRight size={16} /></> : '🏁 Submit'}
        </motion.button>
      </div>
    </div>
  );
}

// ── My Attempts ────────────────────────────────────────────────────────────────
function MyAttempts({ user }: any) {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/test-attempts?user_id=${user.id}&limit=20`).then(r => r.json()).then(a => setAttempts(Array.isArray(a) ? a : [])).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingSpinner size="lg" text="Loading history..." />;
  return (
    <div className="space-y-3">
      {attempts.map((a: any) => (
        <GlassCard key={a.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800 text-sm">{a.subject || a.mode || 'Practice Test'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{new Date(a.submitted_at).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' })} · {a.total_questions}Q</p>
            </div>
            <div className={`text-base font-black px-3 py-1.5 rounded-full ${(a.score || 0) >= 80 ? 'bg-green-100 text-green-700' : (a.score || 0) >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
              {a.score || 0}%
            </div>
          </div>
          {a.correct_answers != null && (
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${a.score || 0}%` }} />
            </div>
          )}
        </GlassCard>
      ))}
      {attempts.length === 0 && (
        <div className="text-center py-12">
          <Target size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No attempts yet. Start practicing!</p>
        </div>
      )}
    </div>
  );
}

// ── Shared Quiz View ───────────────────────────────────────────────────────────
function QuizView({ q, currentQ, total, score, selectedAnswer, answered, onAnswer, onNext, accentColor = 'bg-blue-600' }: any) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={currentQ} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">{currentQ + 1}/{total}</span>
          <span className="text-sm font-bold text-green-600">{score.correct} ✓</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full mb-4">
          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${((currentQ + 1) / total) * 100}%` }} />
        </div>
        <GlassCard className="p-4 mb-3">
          {q.year_asked && <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full mb-2">{q.year_asked}</span>}
          <p className="text-gray-800 font-semibold text-sm leading-relaxed">{q.question_text}</p>
        </GlassCard>
        <div className="space-y-2.5 mb-4">
          {(q.options || []).map((opt: string, idx: number) => {
            let cls = 'bg-white border-gray-200 text-gray-700';
            if (answered) {
              if (idx === q.correct_answer) cls = 'bg-green-50 border-green-400 text-green-800';
              else if (idx === selectedAnswer) cls = 'bg-red-50 border-red-400 text-red-800';
            }
            return (
              <motion.button key={idx} whileTap={!answered ? { scale: 0.98 } : undefined} onClick={() => onAnswer(idx)}
                className={`w-full border-2 rounded-2xl p-3.5 text-left flex items-center gap-3 transition-all ${cls}`}>
                <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {answered && idx === q.correct_answer ? <Check size={12} /> : answered && idx === selectedAnswer ? <X size={12} /> : String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm font-medium">{opt}</span>
              </motion.button>
            );
          })}
        </div>
        {answered && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {q.explanation && (
              <GlassCard className="p-3.5 mb-3 bg-blue-50/50 border border-blue-200">
                <div className="flex items-start gap-2">
                  <Lightbulb size={13} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-700 leading-relaxed">{q.explanation}</p>
                </div>
              </GlassCard>
            )}
            <motion.button whileTap={{ scale: 0.97 }} onClick={onNext}
              className={`w-full ${accentColor} text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2`}>
              {currentQ < total - 1 ? <><span>Next</span><ChevronRight size={16} /></> : '🏁 See Results'}
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
