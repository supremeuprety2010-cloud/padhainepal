import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Clock, AlertCircle, Check, X, ChevronRight } from 'lucide-react';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';

type Mode = 'chapter' | 'subject' | 'full';
type Phase = 'setup' | 'test' | 'result';

export default function MockTest() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<Mode>('subject');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [phase, setPhase] = useState<Phase>('setup');
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (selectedSubject) {
      fetch(`/api/chapters?subject=${encodeURIComponent(selectedSubject)}`).then(r => r.json()).then(setChapters).catch(() => {});
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (phase === 'test' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current!); submitTest(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const startTest = async () => {
    setLoading(true);
    try {
      const qCount = mode === 'full' ? 50 : mode === 'subject' ? 25 : 15;
      const minutes = mode === 'full' ? 90 : mode === 'subject' ? 45 : 25;
      let url = `/api/questions?limit=${qCount}`;
      if (mode !== 'full' && selectedSubject) url += `&subject=${encodeURIComponent(selectedSubject)}`;
      if (mode === 'chapter' && selectedChapter) url += `&chapter_id=${selectedChapter}`;
      const res = await fetch(url);
      const data = await res.json();
      setQuestions(data);
      setAnswers({});
      setCurrentQ(0);
      setTimeLeft(minutes * 60);
      startTimeRef.current = Date.now();
      setPhase('test');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const submitTest = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const taken = Math.round((Date.now() - startTimeRef.current) / 1000);
    setTimeTaken(taken);
    let correct = 0;
    const weakChapters: Record<string, { correct: number; total: number }> = {};
    questions.forEach((q, i) => {
      const chName = q.chapter_title || 'Unknown';
      if (!weakChapters[chName]) weakChapters[chName] = { correct: 0, total: 0 };
      weakChapters[chName].total++;
      if (answers[i] === q.correct_answer) { correct++; weakChapters[chName].correct++; }
    });
    const score = Math.round((correct / questions.length) * 100);
    const weak = Object.entries(weakChapters).filter(([, v]) => v.total > 0 && v.correct / v.total < 0.5).map(([k]) => k);

    if (user) {
      fetch('/api/test-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, mode, subject: selectedSubject, answers: Object.values(answers), score, time_taken: taken, total_questions: questions.length, correct_answers: correct }),
      }).catch(() => {});
    }
    setResult({ score, correct, total: questions.length, weak, timeTaken: taken });
    setPhase('result');
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 pb-24">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-5 pt-12 pb-8">
          <BackButton light fallback="/practice" />
          <h1 className="text-white text-2xl font-black">Mock Test</h1>
          <p className="text-white/70 text-sm">Simulate your NEB exam</p>
        </div>
        <div className="px-5 mt-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-3 block">Test Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {([['chapter', '📖', 'Chapter', '15 Qs · 25 min'], ['subject', '📚', 'Subject', '25 Qs · 45 min'], ['full', '🎯', 'Full Exam', '50 Qs · 90 min']] as const).map(([m, emoji, label, detail]) => (
                <motion.button key={m} whileTap={{ scale: 0.95 }} onClick={() => setMode(m)} className={`p-3 rounded-2xl border-2 text-center transition-all ${mode === m ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'}`}>
                  <div className="text-2xl mb-1">{emoji}</div>
                  <p className={`text-xs font-bold ${mode === m ? 'text-purple-700' : 'text-gray-700'}`}>{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{detail}</p>
                </motion.button>
              ))}
            </div>
          </div>
          {mode !== 'full' && (
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-2 block">Subject</label>
              <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-800 text-sm focus:outline-none focus:border-purple-400 appearance-none shadow-sm">
                <option value="">Select subject...</option>
                {(profile?.subjects || []).map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          {mode === 'chapter' && chapters.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-2 block">Chapter</label>
              <select value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-800 text-sm focus:outline-none focus:border-purple-400 appearance-none shadow-sm">
                <option value="">Select chapter...</option>
                {chapters.map((c: any) => <option key={c.id} value={c.id}>{c.chapter_number}. {c.title}</option>)}
              </select>
            </div>
          )}
          <GlassCard className="p-4 bg-amber-50/50 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800">Timer starts immediately. Auto-submits when time runs out. Make sure you're ready!</p>
            </div>
          </GlassCard>
          <motion.button whileTap={{ scale: 0.97 }} onClick={startTest} disabled={loading || (mode !== 'full' && !selectedSubject)} className="w-full bg-purple-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-200 disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <LoadingSpinner size="sm" /> : '🚀 Start Test'}
          </motion.button>
        </div>
      </div>
    );
  }

  if (phase === 'result' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 pb-24 px-5 pt-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black text-gray-800 mb-6 text-center">Test Results 📊</h1>
          <GlassCard className="p-6 mb-4 text-center">
            <div className="text-5xl font-black mb-2" style={{ color: result.score >= 80 ? '#22c55e' : result.score >= 60 ? '#3b82f6' : '#f59e0b' }}>{result.score}%</div>
            <p className="text-gray-500 text-sm">{result.correct} correct out of {result.total} questions</p>
            <p className="text-gray-400 text-xs mt-1">Time: {formatTime(result.timeTaken)}</p>
          </GlassCard>
          {result.weak.length > 0 && (
            <GlassCard className="p-4 mb-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><X size={16} className="text-red-500" /> Weak Areas</h3>
              <div className="flex flex-wrap gap-2">
                {result.weak.map((ch: string) => (
                  <span key={ch} className="bg-red-100 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full">{ch}</span>
                ))}
              </div>
            </GlassCard>
          )}
          <div className="space-y-3">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setPhase('setup')} className="w-full bg-purple-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-200">Take Another Test</motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/dashboard')} className="w-full bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl">Back to Dashboard</motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  const q = questions[currentQ];
  if (!q) return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 pb-24">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-5 pt-12 pb-6 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/80 text-sm font-medium">{currentQ + 1}/{questions.length}</span>
          <div className={`flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5 ${timeLeft < 300 ? 'bg-red-500/40' : ''}`}>
            <Clock size={14} className="text-white" />
            <span className={`text-white text-sm font-bold ${timeLeft < 300 ? 'text-red-200' : ''}`}>{formatTime(timeLeft)}</span>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={submitTest} className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">Submit</motion.button>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="px-5 mt-4">
        <AnimatePresence mode="wait">
          <motion.div key={currentQ} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}>
            <GlassCard className="p-5 mb-4">
              <p className="text-gray-800 font-semibold leading-relaxed">{q.question_text}</p>
            </GlassCard>
            <div className="space-y-2.5 mb-4">
              {(q.options || []).map((opt: string, idx: number) => (
                <motion.button key={idx} whileTap={{ scale: 0.98 }} onClick={() => setAnswers(a => ({ ...a, [currentQ]: idx }))} className={`w-full border-2 rounded-2xl p-4 text-left transition-all flex items-center gap-3 ${answers[currentQ] === idx ? 'border-purple-500 bg-purple-50' : 'bg-white border-gray-200'}`}>
                  <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${answers[currentQ] === idx ? 'border-purple-500 bg-purple-500 text-white' : 'border-gray-300 text-gray-500'}`}>
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
