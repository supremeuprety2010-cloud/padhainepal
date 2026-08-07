import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, AlertCircle, BookOpen } from 'lucide-react';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/GlassCard';

interface Message { role: 'user' | 'assistant'; content: string; }

const SUGGESTED = [
  'Explain Newton\'s Laws of Motion',
  'What is photosynthesis?',
  'Solve: 2x² + 5x - 3 = 0',
  'Explain the French Revolution',
  'What is the difference between acid and base?',
];

export default function AITutor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [usageLeft, setUsageLeft] = useState<number | null>(null);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasAutoSent = useRef(false);

  useEffect(() => {
    if (user) {
      fetch(`/api/ai-usage?user_id=${user.id}`).then(r => r.json()).then(d => setUsageLeft(d.remaining)).catch(() => {});
    }
  }, [user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text?: string) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput('');
    setError('');
    const newMessages: Message[] = [...messages, { role: 'user', content: q }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, question: q, grade: profile?.grade, subject: '', history: messages.slice(-4) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI error');
      setMessages([...newMessages, { role: 'assistant', content: data.answer }]);
      if (data.remaining !== undefined) setUsageLeft(data.remaining);
    } catch (err: any) {
      setError(err.message);
      setMessages(newMessages.slice(0, -1));
    } finally { setLoading(false); }
  };

  // Auto-send query if passed in URL parameter e.g. /ai-tutor?q=...
  useEffect(() => {
    if (initialQuery && !hasAutoSent.current && user) {
      hasAutoSent.current = true;
      sendMessage(initialQuery);
    }
  }, [initialQuery, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 flex flex-col pb-20">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 pt-12 pb-5">
        <BackButton light fallback="/home" />
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-white text-xl font-black flex items-center gap-2"><Sparkles size={20} /> Nep AI Tutor</h1>
            <p className="text-white/70 text-xs mt-0.5">Curriculum-aware AI for NEB students</p>
          </div>
          {usageLeft !== null && (
            <div className="bg-white/20 rounded-full px-3 py-1.5 text-white text-xs font-bold">{usageLeft} left today</div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="p-5 text-center mb-4">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="font-bold text-gray-800 mb-1">Ask me anything!</h3>
              <p className="text-gray-500 text-sm">I'm trained on NEB Grade {profile?.grade} curriculum. Ask about any subject.</p>
            </GlassCard>
            <p className="text-xs text-gray-400 font-semibold mb-2 px-1">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map(s => (
                <motion.button key={s} whileTap={{ scale: 0.95 }} onClick={() => sendMessage(s)} className="bg-white border border-gray-200 rounded-2xl px-3 py-2 text-xs text-gray-700 shadow-sm">
                  {s}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Sparkles size={14} className="text-amber-600" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-amber-500 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'}`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center mr-2 mt-1"><Sparkles size={14} className="text-amber-600" /></div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}

        {error && (
          <GlassCard className="p-3 bg-red-50 border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-red-500" />
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          </GlassCard>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-20 px-4 py-3 bg-white/80 backdrop-blur-xl border-t border-gray-100">
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 min-h-[44px] flex items-center">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}} placeholder="Ask any NEB question..." rows={1} className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none" style={{ maxHeight: 100 }} />
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendMessage()} disabled={!input.trim() || loading} className="w-11 h-11 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 disabled:opacity-40">
            <Send size={16} className="text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
