import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageCircle, ThumbsUp } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import GlassCard from '../../../components/GlassCard';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function SubjectDoubts({ subject }: { subject: string }) {
  const { user, profile } = useAuth();
  const [doubts, setDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    fetch(`/api/doubts?subject=${encodeURIComponent(subject)}`)
      .then(r => r.json()).then(d => setDoubts(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetch_(); }, [subject]);

  const post = async () => {
    if (!title.trim() || !user) return;
    setPosting(true);
    await fetch('/api/doubts', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, user_name: profile?.full_name || 'Student', title, body, subject }) }).catch(() => {});
    setTitle(''); setBody(''); setShowForm(false); setPosting(false);
    fetch_();
  };

  return (
    <div className="px-4 pt-4 space-y-3">
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForm(s => !s)}
        className="w-full bg-teal-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-teal-200">
        <Plus size={18} /> Ask a Doubt
      </motion.button>
      {showForm && (
        <GlassCard className="p-4 space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Your question..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="More details..." rows={3}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none" />
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 font-medium py-2.5 rounded-xl text-sm">Cancel</button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={post} disabled={posting || !title.trim()}
              className="flex-1 bg-teal-600 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-40">
              {posting ? 'Posting...' : 'Post'}
            </motion.button>
          </div>
        </GlassCard>
      )}
      {loading ? <LoadingSpinner size="lg" /> : (
        <div className="space-y-3">
          {doubts.map((d: any) => (
            <GlassCard key={d.id} className="p-4">
              <p className="font-semibold text-gray-800 text-sm">{d.title}</p>
              {d.body && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{d.body}</p>}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-gray-400">{d.user_name}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400"><MessageCircle size={11} />{d.reply_count || 0}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400"><ThumbsUp size={11} />{d.upvotes || 0}</span>
              </div>
            </GlassCard>
          ))}
          {doubts.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No doubts yet. Be the first!</p>}
        </div>
      )}
    </div>
  );
}
