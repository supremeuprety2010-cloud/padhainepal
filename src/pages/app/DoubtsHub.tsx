import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageCircle, ThumbsUp, ChevronLeft, ChevronRight, Search, User, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AppHeader from '../../components/AppHeader';
import GlassCard from '../../components/GlassCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import AdminBadge from '../../components/AdminBadge';

type DoubtsTab = 'all' | 'mine';

export function DoubtsHub() {
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();
  const [tab, setTab] = useState<DoubtsTab>('all');
  const [doubts, setDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [search, setSearch] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchDoubts = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/doubts?limit=30';
      if (tab === 'mine' && user) url += `&user_id=${user.id}`;
      if (subject) url += `&subject=${encodeURIComponent(subject)}`;
      if (search) url += `&q=${encodeURIComponent(search)}`;
      const data = await fetch(url).then(r => r.json());
      setDoubts(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tab, subject, search, user]);

  useEffect(() => { fetchDoubts(); }, [fetchDoubts]);

  const post = async () => {
    if (!title.trim() || !user) return;
    setPosting(true);
    await fetch('/api/doubts', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, user_name: profile?.full_name || 'Student', title, body, subject }) }).catch(() => {});
    setTitle(''); setBody(''); setSubject(''); setShowForm(false); setPosting(false);
    fetchDoubts();
  };

  const deleteDoubt = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Admin: Delete this doubt?')) return;
    await fetch(`/api/doubts/${id}`, { method: 'DELETE' }).catch(() => {});
    fetchDoubts();
  };

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now'; if (m < 60) return `${m}m`; const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`; return `${Math.floor(h / 24)}d`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <AppHeader title="Doubts" back fallback="/home" showActions={false} />
      <div className="pt-16 px-4 space-y-4">
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1 mt-2">
          {[['all','All Doubts'],['mine','My Doubts']].map(([id, l]) => (
            <button key={id} onClick={() => setTab(id as DoubtsTab)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>{l}</button>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doubts..."
              className="w-full bg-white border border-gray-200 rounded-2xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
          </div>
          <select value={subject} onChange={e => setSubject(e.target.value)}
            className="bg-white border border-gray-200 rounded-2xl px-3 py-2.5 text-xs focus:outline-none appearance-none">
            <option value="">All</option>
            {(profile?.subjects || []).map((s: string) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Post button */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForm(s => !s)}
          className="w-full bg-teal-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-teal-200">
          <Plus size={18} /> Ask a Doubt
        </motion.button>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <GlassCard className="p-4 space-y-3">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Your question title..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
                <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Explain your doubt in detail..." rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none" />
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none appearance-none">
                  <option value="">Select subject</option>
                  {(profile?.subjects || []).map((s: string) => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 font-medium py-2.5 rounded-xl text-sm">Cancel</button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={post} disabled={posting || !title.trim()}
                    className="flex-1 bg-teal-600 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-40">{posting ? 'Posting...' : 'Post'}</motion.button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? <LoadingSpinner size="lg" text="Loading doubts..." /> : (
          <div className="space-y-3">
            {doubts.map((d: any) => (
              <GlassCard key={d.id} hover onClick={() => navigate(`/doubts/${d.id}`)} className="p-4 relative">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {d.subject && <span className="bg-teal-100 text-teal-700 text-xs font-medium px-2 py-0.5 rounded-full">{d.subject}</span>}
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm leading-snug">{d.title}</h3>
                    {d.body && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{d.body}</p>}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <User size={10} />
                        <span>{d.user_name}</span>
                      </span>
                      <AdminBadge userId={d.user_id} size="sm" />
                      <span className="flex items-center gap-1 text-xs text-gray-400"><MessageCircle size={11} />{d.reply_count || 0}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-400"><ThumbsUp size={11} />{d.upvotes || 0}</span>
                      <span className="text-xs text-gray-300 ml-auto">{timeAgo(d.created_at)}</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={(e) => deleteDoubt(d.id, e)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                      <Trash2 size={15} />
                    </button>
                  )}
                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0 mt-1" />
                </div>
              </GlassCard>
            ))}
            {doubts.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No doubts yet. Ask the first one!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Doubt Detail ───────────────────────────────────────────────────────────────
export function DoubtDetail() {
  const { doubtId } = useParams<{ doubtId: string }>();
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();
  const [doubt, setDoubt] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [answer, setAnswer] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doubtId) return;
    Promise.all([
      fetch(`/api/doubts/${doubtId}`).then(r => r.json()),
      fetch(`/api/doubt-answers?doubt_id=${doubtId}`).then(r => r.json()),
    ]).then(([d, a]) => { setDoubt(d); setAnswers(Array.isArray(a) ? a : []); }).catch(() => {}).finally(() => setLoading(false));
  }, [doubtId]);

  const postAnswer = async () => {
    if (!answer.trim() || !user || !doubtId) return;
    setPosting(true);
    await fetch('/api/doubt-answers', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doubt_id: parseInt(doubtId), user_id: user.id, user_name: profile?.full_name || 'Student', content: answer }) }).catch(() => {});
    setAnswer('');
    const data = await fetch(`/api/doubt-answers?doubt_id=${doubtId}`).then(r => r.json()).catch(() => []);
    setAnswers(Array.isArray(data) ? data : []);
    setPosting(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-4">
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => navigate('/doubts')} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-bold text-gray-900 text-sm flex-1 truncate">Doubt Detail</h1>
      </div>
      <div className="px-4 py-4 space-y-4">
        {doubt && (
          <GlassCard className="p-4">
            {doubt.subject && <span className="inline-block bg-teal-100 text-teal-700 text-xs font-medium px-2 py-0.5 rounded-full mb-2">{doubt.subject}</span>}
            <h2 className="font-bold text-gray-800 mb-2">{doubt.title}</h2>
            {doubt.body && <p className="text-sm text-gray-600 leading-relaxed mb-3">{doubt.body}</p>}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <User size={11} /><span>{doubt.user_name}</span>
              <AdminBadge userId={doubt.user_id} size="sm" />
              <span>·</span><span>{answers.length} answers</span>
            </div>
          </GlassCard>
        )}

        <h3 className="font-bold text-gray-700 text-sm">{answers.length} Answer{answers.length !== 1 ? 's' : ''}</h3>
        <div className="space-y-3">
          {answers.map((a: any) => (
            <GlassCard key={a.id} className={`p-4 ${a.is_accepted ? 'border-2 border-green-400 bg-green-50/30' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">{a.user_name?.[0] || 'S'}</div>
                <span className="text-sm font-semibold text-gray-800">{a.user_name}</span>
                <AdminBadge userId={a.user_id} size="sm" />
                {a.is_accepted && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">✓ Best Answer</span>}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{a.content}</p>
              <div className="flex items-center gap-2 mt-2">
                <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors">
                  <ThumbsUp size={12} /> {a.upvotes || 0}
                </button>
              </div>
            </GlassCard>
          ))}
          {answers.length === 0 && <p className="text-center text-gray-400 text-sm py-6">No answers yet. Be the first to help!</p>}
        </div>

        <GlassCard className="p-4 space-y-3">
          <h3 className="font-bold text-gray-800 text-sm">Your Answer</h3>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Write a helpful answer..." rows={4}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none" />
          <motion.button whileTap={{ scale: 0.97 }} onClick={postAnswer} disabled={posting || !answer.trim()}
            className="w-full bg-teal-600 text-white font-bold py-3 rounded-2xl text-sm disabled:opacity-40">
            {posting ? 'Posting...' : 'Post Answer'}
          </motion.button>
        </GlassCard>
      </div>
    </div>
  );
}
