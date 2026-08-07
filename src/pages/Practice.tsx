import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, X, Lightbulb, BarChart3 } from 'lucide-react';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Practice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const subjectParam = searchParams.get('subject');

  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(subjectParam || '');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'select' | 'quiz' | 'result'>('select');

  useEffect(() => {
    fetch('/api/subjects').then(r => r.json()).then(setSubjects).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetch(`/api/chapters?subject=${encodeURIComponent(selectedSubject)}`).then(r => r.json()).then(setChapters).catch(() => {});
    }
  }, [selectedSubject]);

  const loadQuestions = async () => {
    if (!selectedSubject) return;
    setLoading(true);
    try {
      const url = selectedChapter
        ? `/api/questions?chapter_id=${selectedChapter}&limit=10`
        : `/api/questions?subject=${encodeURIComponent(selectedSubject)}&limit=10`;
      const res = await fetch(url);
      const data = await res.json();
      setQuestions(data);
      setCurrentQ(0);
      setScore({ correct: 0, total: 0 });
      setSelectedAnswer(null);
      setShowExplanation(false);
      setAnswered(false);
      setPhase('quiz');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (idx: number) => {
    if (answered) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    const q = questions[currentQ];
    const isCorrect = idx === q.correct_answer;
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));

    // Record attempt
    if (user) {
      fetch('/api/question-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, question_id: q.id, selected_answer: idx, is_correct: isCorrect }),
      }).catch(() => {});
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setAnswered(false);
    } else {
      setPhase('result');
    }
  };

  const q = questions[currentQ];

  if (phase === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-24">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 pt-12 pb-8">
          <BackButton light fallback="/practice" />
          <h1 className="text-white text-2xl font-black">MCQ Practice</h1>
          <p className="text-white/70 text-sm">Choose subject & chapter</p>
        </div>
        <div className="px-5 mt-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-2 block">Subject</label>
            <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedChapter(''); }} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-800 text-sm focus:outline-none focus:border-blue-400 appearance-none shadow-sm">
              <option value="">All subjects</option>
              {(profile?.subjects || []).map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {chapters.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-2 block">Chapter (optional)</label>
              <select value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-800 text-sm focus:outline-none focus:border-blue-400 appearance-none shadow-sm">
                <option value="">All chapters</option>
                {chapters.map((c: any) => <option key={c.id} value={c.id}>{c.chapter_number}. {c.title}</option>)}
              </select>
            </div>
          )}
          <motion.button whileTap={{ scale: 0.97 }} onClick={loadQuestions} disabled={!selectedSubject || loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <LoadingSpinner size="sm" /> : '🚀 Start Practice'}
          </motion.button>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    const pct = Math.round((score.correct / score.total) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col items-center justify-center px-5 pb-24">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm">
          <GlassCard className="p-8 text-center">
            <div className="text-6xl mb-4">{pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '💪'}</div>
            <h2 className="text-2xl font-black text-gray-800 mb-1">Practice Complete!</h2>
            <p className="text-gray-500 text-sm mb-6">You scored {score.correct} out of {score.total}</p>
            <div className="w-32 h-32 mx-auto mb-6 relative">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={pct >= 80 ? '#22c55e' : pct >= 60 ? '#3b82f6' : '#f59e0b'} strokeWidth="3" strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-gray-800">{pct}%</span>
              </div>
            </div>
            <div className="space-y-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setPhase('select'); setQuestions([]); }} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl">Practice Again</motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/dashboard')} className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-2xl">Back to Dashboard</motion.button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  if (!q) return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-24">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setPhase('select')} className="flex items-center gap-1 text-white/70 text-sm"><ChevronLeft size={16} /> Exit</button>
          <span className="text-white/80 text-sm font-medium">{currentQ + 1} / {questions.length}</span>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
            <span className="text-white text-xs font-bold">{score.correct}/{score.total}</span>
          </div>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full">
          <div className="h-full bg-white rounded-full transition-all duration-300" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="px-5 mt-4">
        <AnimatePresence mode="wait">
          <motion.div key={currentQ} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.2 }}>
            <GlassCard className="p-5 mb-4">
              {q.difficulty && <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-3 ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{q.difficulty}</span>}
              <p className="text-gray-800 font-semibold leading-relaxed">{q.question_text}</p>
            </GlassCard>

            <div className="space-y-2.5 mb-4">
              {(q.options || []).map((opt: string, idx: number) => {
                let style = 'bg-white border-gray-200 text-gray-700';
                if (answered) {
                  if (idx === q.correct_answer) style = 'bg-green-50 border-green-400 text-green-800';
                  else if (idx === selectedAnswer) style = 'bg-red-50 border-red-400 text-red-800';
                } else if (selectedAnswer === idx) style = 'bg-blue-50 border-blue-400 text-blue-800';
                return (
                  <motion.button key={idx} whileTap={!answered ? { scale: 0.98 } : undefined} onClick={() => handleAnswer(idx)} className={`w-full border-2 rounded-2xl p-4 text-left transition-all flex items-center gap-3 ${style} ${!answered ? 'active:scale-98' : ''}`}>
                    <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {answered && idx === q.correct_answer ? <Check size={14} /> : answered && idx === selectedAnswer ? <X size={14} /> : String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-sm font-medium">{opt}</span>
                  </motion.button>
                );
              })}
            </div>

            {answered && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {q.explanation && (
                  <GlassCard className="p-4 mb-4 bg-blue-50/50 border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Lightbulb size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-blue-700 mb-1">Explanation</p>
                        <p className="text-sm text-gray-700">{q.explanation}</p>
                      </div>
                    </div>
                  </GlassCard>
                )}
                <motion.button whileTap={{ scale: 0.97 }} onClick={nextQuestion} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                  {currentQ < questions.length - 1 ? <><span>Next Question</span><ChevronRight size={18} /></> : '🏁 See Results'}
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
