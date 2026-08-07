import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, X, Lightbulb, Zap } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useXP } from '../../../hooks/useXP';
import GlassCard from '../../../components/GlassCard';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function SubjectPractice({ subject }: { subject: string }) {
  const { user } = useAuth();
  const { awardXP } = useXP();
  const [chapters, setChapters] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [phase, setPhase] = useState<'select' | 'quiz' | 'result'>('select');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/chapters?subject=${encodeURIComponent(subject)}`).then(r => r.json()).then(setChapters).catch(() => {});
  }, [subject]);

  const startPractice = async () => {
    setLoading(true);
    try {
      let url = `/api/questions?subject=${encodeURIComponent(subject)}&limit=10`;
      if (selectedChapter) url = `/api/questions?chapter_id=${selectedChapter}&limit=10`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.length) { alert('No questions available for this selection yet.'); return; }
      setQuestions(data);
      setCurrentQ(0); setScore({ correct: 0, total: 0 });
      setSelectedAnswer(null); setAnswered(false);
      setPhase('quiz');
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
      // Auto-update chapter progress if >= 5 MCQs answered in chapter
      if (selectedChapter) {
        fetch('/api/chapter-progress/auto', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, chapter_id: selectedChapter, subject }) }).catch(() => {});
      }
    }
  };

  const next = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1); setSelectedAnswer(null); setAnswered(false);
    } else { setPhase('result'); }
  };

  const q = questions[currentQ];

  if (phase === 'select') return (
    <div className="px-4 pt-4 space-y-4">
      <GlassCard className="p-4">
        <label className="text-sm font-semibold text-gray-600 mb-2 block">Chapter (optional)</label>
        <select value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 appearance-none">
          <option value="">All chapters (random)</option>
          {chapters.map((c: any) => <option key={c.id} value={c.id}>{c.chapter_number}. {c.title}</option>)}
        </select>
      </GlassCard>
      <motion.button whileTap={{ scale: 0.97 }} onClick={startPractice} disabled={loading}
        className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
        {loading ? <LoadingSpinner size="sm" /> : <><Zap size={18} /> Start Practice</>}
      </motion.button>
    </div>
  );

  if (phase === 'result') {
    const pct = Math.round((score.correct / score.total) * 100);
    return (
      <div className="px-4 pt-8 flex flex-col items-center">
        <div className="text-6xl mb-4">{pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '💪'}</div>
        <h2 className="text-2xl font-black text-gray-800 mb-1">{pct}%</h2>
        <p className="text-gray-500 text-sm mb-8">{score.correct}/{score.total} correct</p>
        <div className="flex gap-3 w-full">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setPhase('select'); setQuestions([]); }}
            className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-2xl">Practice Again</motion.button>
        </div>
      </div>
    );
  }

  if (!q) return <div className="flex justify-center pt-12"><LoadingSpinner /></div>;

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{currentQ + 1}/{questions.length}</span>
        <span className="text-sm font-bold text-green-600">{score.correct} ✓</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full mb-4">
        <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={currentQ} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}>
          <GlassCard className="p-4 mb-4">
            {q.difficulty && <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2 ${
              q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
            }`}>{q.difficulty}</span>}
            <p className="text-gray-800 font-semibold leading-relaxed text-sm">{q.question_text}</p>
          </GlassCard>
          <div className="space-y-2.5 mb-4">
            {(q.options || []).map((opt: string, idx: number) => {
              let cls = 'bg-white border-gray-200 text-gray-700';
              if (answered) {
                if (idx === q.correct_answer) cls = 'bg-green-50 border-green-400 text-green-800';
                else if (idx === selectedAnswer) cls = 'bg-red-50 border-red-400 text-red-800';
              } else if (selectedAnswer === idx) cls = 'bg-blue-50 border-blue-400 text-blue-800';
              return (
                <motion.button key={idx} whileTap={!answered ? { scale: 0.98 } : undefined}
                  onClick={() => handleAnswer(idx)}
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
                    <Lightbulb size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700 leading-relaxed">{q.explanation}</p>
                  </div>
                </GlassCard>
              )}
              <motion.button whileTap={{ scale: 0.97 }} onClick={next}
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2">
                {currentQ < questions.length - 1 ? <><span>Next</span><ChevronRight size={16} /></> : '🏁 See Results'}
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
