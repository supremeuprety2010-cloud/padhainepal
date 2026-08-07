import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, MessageCircle, ThumbsUp, ChevronRight, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Community() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const subjectFilter = searchParams.get('subject') || '';
  const [doubts, setDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState(subjectFilter);
  const [posting, setPosting] = useState(false);
  const [search, setSearch] = useState('');

  const fetchDoubts = async () => {
    setLoading(true);
    try {
      let url = '/api/doubts';
      const params = new URLSearchParams();
      if (subject) params.set('subject', subject);
      if (search) params.set('q', search);
      if (params.toString()) url += '?' + params.toString();
      const res = await fetch(url);
      const data = await res.json();
      setDoubts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDoubts(); }, [subject, search]);

  const postDoubt = async () => {
    if (!title.trim() || !user) return;
    setPosting(true);
    try {
      await fetch('/api/doubts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, user_name: profile?.full_name || 'Student', title, body, subject }),
      });
      setTitle(''); setBody(''); setShowForm(false);
      fetchDoubts();
    } catch (e) { console.error(e); }
    finally { setPosting(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 pb-24">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-700 px-5 pt-12 pb-6">
        <h1 className="text-white text-2xl font-black">Doubts Forum</h1>
        <p className="text-white/70 text-sm">Ask questions, help others</p>
      </div>

      <div className="px-5 mt-4 space-y-3">
        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doubts..." className="w-full bg-white border border-gray-200 rounded-2xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
          </div>
          <select value={subject} onChange={e => setSubject(e.target.value)} className="bg-white border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none appearance-none">
            <option value="">All</option>
            {(profile?.subjects || []).map((s: string) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Post Button */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForm(!showForm)} className="w-full bg-teal-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-teal-200">
          <Plus size={18} /> Ask a Doubt
        </motion.button>

        {/* Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="p-4 space-y-3">
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Your question title..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Describe your doubt in detail..." rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none" />
              <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none appearance-none">
                <option value="">Select subject</option>
                {(profile?.subjects || []).map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 font-medium py-2.5 rounded-xl text-sm">Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={postDoubt} disabled={posting || !title.trim()} className="flex-1 bg-teal-600 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-40">
                  {posting ? 'Posting...' : 'Post'}
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Doubts List */}
        {loading ? <LoadingSpinner size="lg" text="Loading doubts..." /> : (
          <div className="space-y-3">
            {doubts.map((d: any) => (
              <GlassCard key={d.id} hover onClick={() => navigate(`/doubt/${d.id}`)} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {d.subject && <span className="inline-block bg-teal-100 text-teal-700 text-xs font-medium px-2 py-0.5 rounded-full mb-2">{d.subject}</span>}
                    <h3 className="font-semibold text-gray-800 text-sm leading-snug">{d.title}</h3>
                    {d.body && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{d.body}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400">{d.user_name}</span>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MessageCircle size={12} /> {d.reply_count || 0}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <ThumbsUp size={12} /> {d.upvotes || 0}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0 mt-1" />
                </div>
              </GlassCard>
            ))}
            {doubts.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No doubts yet. Be the first to ask!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
