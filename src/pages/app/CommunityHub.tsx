import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  Globe, GraduationCap, School, MapPin, Search, Filter, X, Check,
  Send, ChevronRight, Flag, EyeOff, UserX, Image, FileText,
  Trophy, Sparkles, Zap, Flame, Users, BadgeCheck, Bell,
  ChevronDown, ChevronUp, Smile, ArrowLeft, BookOpen, Target,
  TrendingUp, Star, Clock, Hash
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AppHeader from '../../components/AppHeader';
import GlassCard from '../../components/GlassCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import AdminBadge from '../../components/AdminBadge';

// ─── Types ────────────────────────────────────────────────────────────────────
type CommunityTab = 'feed' | 'discover' | 'institute';
type PostType = 'text' | 'image' | 'achievement' | 'note' | 'doubt';
type Visibility = 'public' | 'grade' | 'school' | 'district';
type FeedFilter = 'all' | 'grade' | 'school' | 'district' | 'trending' | 'latest' | 'bookmarked';

const VISIBILITY_CONFIG: Record<Visibility, { icon: any; label: string; desc: string; color: string }> = {
  public:   { icon: Globe,          label: 'Public',      desc: 'Everyone can see',       color: 'text-blue-600 bg-blue-50 border-blue-200' },
  grade:    { icon: GraduationCap,  label: 'My Grade',    desc: 'Same grade only',        color: 'text-purple-600 bg-purple-50 border-purple-200' },
  school:   { icon: School,         label: 'My School',   desc: 'Same school only',       color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  district: { icon: MapPin,         label: 'My District', desc: 'Same district only',     color: 'text-amber-600 bg-amber-50 border-amber-200' },
};

const POST_TYPES: { id: PostType; icon: any; label: string; color: string }[] = [
  { id: 'text',        icon: FileText, label: 'Text',        color: 'text-blue-600 bg-blue-50' },
  { id: 'image',       icon: Image,    label: 'Photo',       color: 'text-rose-600 bg-rose-50' },
  { id: 'achievement', icon: Trophy,   label: 'Achievement', color: 'text-amber-600 bg-amber-50' },
  { id: 'note',        icon: BookOpen, label: 'Notes',       color: 'text-emerald-600 bg-emerald-50' },
  { id: 'doubt',       icon: Target,   label: 'Doubt',       color: 'text-purple-600 bg-purple-50' },
];

const INSTITUTE_TYPE_COLORS: Record<string, string> = {
  School: 'bg-blue-100 text-blue-700',
  College: 'bg-purple-100 text-purple-700',
  Government: 'bg-red-100 text-red-700',
  'Coaching Center': 'bg-amber-100 text-amber-700',
  Club: 'bg-emerald-100 text-emerald-700',
};

const POST_TYPE_ICONS: Record<string, string> = {
  announcement: '📢', event: '📅', scholarship: '🎓', workshop: '🛠️',
  competition: '🏆', exam: '📝',
};

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CommunityHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as CommunityTab) || 'feed';
  const setTab = (t: CommunityTab) => setSearchParams({ tab: t }, { replace: true });
  const [showCreate, setShowCreate] = useState(false);

  const tabs = [
    { id: 'feed' as CommunityTab,      icon: Hash,       label: 'Feed'      },
    { id: 'discover' as CommunityTab,  icon: Search,     label: 'Discover'  },
    { id: 'institute' as CommunityTab, icon: BadgeCheck, label: 'Institutes'},
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Sticky header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <h1 className="font-black text-gray-900 text-lg">Community</h1>
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.9 }} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center relative">
              <Bell size={17} className="text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </motion.button>
          </div>
        </div>
        {/* Tab bar */}
        <div className="flex px-4 pb-0 max-w-lg mx-auto">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold border-b-2 transition-all ${
                tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'
              }`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {tab === 'feed'      && <FeedTab onCreatePost={() => setShowCreate(true)} />}
          {tab === 'discover'  && <DiscoverTab />}
          {tab === 'institute' && <InstituteTab />}
        </motion.div>
      </AnimatePresence>

      {/* FAB */}
      {tab === 'feed' && (
        <motion.button whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.05 }}
          onClick={() => setShowCreate(true)}
          className="fixed bottom-24 right-5 w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-300 z-30">
          <Plus size={24} className="text-white" />
        </motion.button>
      )}

      {/* Create post sheet */}
      <AnimatePresence>
        {showCreate && <CreatePostSheet onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FEED TAB
// ════════════════════════════════════════════════════════════════════════════
function FeedTab({ onCreatePost }: { onCreatePost: () => void }) {
  const { user, profile } = useAuth();
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const FILTERS: { id: FeedFilter; label: string }[] = [
    { id: 'all',        label: '🌍 All'        },
    { id: 'grade',      label: '🎓 My Grade'   },
    { id: 'school',     label: '🏫 My School'  },
    { id: 'district',   label: '📍 My District'},
    { id: 'trending',   label: '🔥 Trending'   },
    { id: 'latest',     label: '⚡ Latest'     },
    { id: 'bookmarked', label: '🔖 Saved'      },
  ];

  const fetchPosts = useCallback(async (reset = true) => {
    if (!user) return;
    reset ? setLoading(true) : setLoadingMore(true);
    const off = reset ? 0 : offset;
    try {
      const params = new URLSearchParams({
        filter, user_id: user.id, limit: '15', offset: String(off),
        grade: String(profile?.grade || ''), school: profile?.school_name || '',
        district: profile?.district || '',
      });
      const data = await fetch(`/api/community/posts?${params}`).then(r => r.json());
      const arr = Array.isArray(data) ? data : [];
      if (reset) { setPosts(arr); setOffset(arr.length); }
      else { setPosts(p => [...p, ...arr]); setOffset(o => o + arr.length); }
      setHasMore(arr.length === 15);
    } catch { }
    finally { setLoading(false); setLoadingMore(false); }
  }, [filter, user, profile]);

  useEffect(() => { fetchPosts(true); }, [filter]);

  const updatePost = (id: number, updates: any) =>
    setPosts(ps => ps.map(p => p.id === id ? { ...p, ...updates } : p));

  const removePost = (id: number) => setPosts(ps => ps.filter(p => p.id !== id));

  return (
    <div>
      {/* Filter chips */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide sticky top-[105px] bg-gray-50 z-30">
        {FILTERS.map(f => (
          <motion.button key={f.id} whileTap={{ scale: 0.93 }} onClick={() => setFilter(f.id)}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              filter === f.id ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-gray-600 border border-gray-200'
            }`}>
            {f.label}
          </motion.button>
        ))}
      </div>

      {/* Posts */}
      <div className="px-4 space-y-3 pb-4">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <PostSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <EmptyFeed filter={filter} onCreatePost={onCreatePost} />
        ) : (
          posts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <PostCard post={post} onUpdate={u => updatePost(post.id, u)} onDelete={() => removePost(post.id)} />
            </motion.div>
          ))
        )}
        {hasMore && !loading && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => fetchPosts(false)} disabled={loadingMore}
            className="w-full py-3 text-sm text-blue-600 font-semibold flex items-center justify-center gap-2">
            {loadingMore ? <LoadingSpinner size="sm" /> : 'Load more posts'}
          </motion.button>
        )}
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, onUpdate, onDelete }: { post: any; onUpdate: (u: any) => void; onDelete: () => void }) {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [liked, setLiked] = useState(post.liked || false);
  const [saved, setSaved] = useState(post.saved || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const isOwn = post.user_id === user?.id || isAdmin;
  const vc = VISIBILITY_CONFIG[post.visibility as Visibility] || VISIBILITY_CONFIG.public;
  const VIcon = vc.icon;

  const toggleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c: number) => newLiked ? c + 1 : Math.max(0, c - 1));
    onUpdate({ liked: newLiked, like_count: newLiked ? (post.like_count || 0) + 1 : Math.max(0, (post.like_count || 0) - 1) });
    await fetch('/api/community/like', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, user_id: user?.id, action: newLiked ? 'like' : 'unlike' }),
    }).catch(() => {});
  };

  const toggleSave = async () => {
    const newSaved = !saved;
    setSaved(newSaved);
    await fetch('/api/community/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, user_id: user?.id, action: newSaved ? 'save' : 'unsave' }),
    }).catch(() => {});
  };

  const deletePost = async () => {
    await fetch('/api/community/posts', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, user_id: user?.id }),
    }).catch(() => {});
    onDelete();
  };

  const reportPost = async (reason: string) => {
    await fetch('/api/community/report', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, reporter_id: user?.id, reason }),
    }).catch(() => {});
    setShowReport(false);
    setShowMenu(false);
  };

  const postTypeInfo = POST_TYPES.find(t => t.id === post.post_type);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => navigate(`/user/${post.user_id}`)}
          className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {post.user_name?.[0]?.toUpperCase() || 'S'}
        </motion.button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(`/user/${post.user_id}`)}
              className="font-bold text-gray-900 text-sm hover:text-blue-600 transition-colors">
              {post.user_name}
            </motion.button>
            <AdminBadge userId={post.user_id} size="sm" />
            {postTypeInfo && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${postTypeInfo.color}`}>
                {postTypeInfo.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {post.user_grade && <span className="text-xs text-gray-400">Grade {post.user_grade}</span>}
            {post.user_school && <span className="text-xs text-gray-400 truncate max-w-[120px]">· {post.user_school}</span>}
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Visibility badge */}
          <span className={`text-xs font-semibold px-2 py-1 rounded-full border flex items-center gap-1 ${vc.color}`}>
            <VIcon size={10} />
            {vc.label}
          </span>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowMenu(s => !s)}
            className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center relative">
            <MoreHorizontal size={16} className="text-gray-400" />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {post.subject_tag && (
          <span className="inline-block bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
            #{post.subject_tag}
          </span>
        )}
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className={`grid gap-1 mx-4 mb-3 rounded-2xl overflow-hidden ${post.images.length === 1 ? 'grid-cols-1' : post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {post.images.slice(0, 4).map((img: string, i: number) => (
            <div key={i} className="relative aspect-square">
              <img src={img} alt="" className="w-full h-full object-cover" />
              {i === 3 && post.images.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-black text-lg">+{post.images.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
        <div className="flex items-center gap-4">
          <motion.button whileTap={{ scale: 0.85 }} onClick={toggleLike}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${liked ? 'text-red-500' : 'text-gray-400'}`}>
            <motion.div animate={liked ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            </motion.div>
            <span>{likeCount > 0 ? likeCount : ''}</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowComments(s => !s)}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${showComments ? 'text-blue-500' : 'text-gray-400'}`}>
            <MessageCircle size={18} />
            <span>{post.comment_count > 0 ? post.comment_count : ''}</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }} className="flex items-center gap-1.5 text-sm text-gray-400">
            <Share2 size={18} />
          </motion.button>
        </div>
        <motion.button whileTap={{ scale: 0.85 }} onClick={toggleSave}
          className={`transition-colors ${saved ? 'text-blue-600' : 'text-gray-400'}`}>
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
        </motion.button>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <CommentsSection postId={post.id} onCommentAdded={() => onUpdate({ comment_count: (post.comment_count || 0) + 1 })} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50" onClick={() => setShowMenu(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              className="absolute right-4 top-12 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 min-w-[160px]">
              {isOwn ? (
                <>
                  <button onClick={deletePost} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <X size={15} /> Delete Post
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setShowReport(true); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <Flag size={15} /> Report
                  </button>
                  <button onClick={() => setShowMenu(false)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <EyeOff size={15} /> Hide Post
                  </button>
                  <button onClick={() => setShowMenu(false)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <UserX size={15} /> Block User
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Report modal */}
      <AnimatePresence>
        {showReport && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowReport(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl pb-8">
              <div className="flex justify-center pt-3 pb-4"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
              <div className="px-5">
                <h3 className="font-black text-gray-900 mb-4">Report Post</h3>
                {['Spam', 'Inappropriate content', 'Misinformation', 'Harassment', 'Other'].map(r => (
                  <button key={r} onClick={() => reportPost(r)}
                    className="w-full text-left py-3.5 text-sm text-gray-700 border-b border-gray-100 last:border-0 hover:text-blue-600 transition-colors">
                    {r}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Comments Section ─────────────────────────────────────────────────────────
function CommentsSection({ postId, onCommentAdded }: { postId: number; onCommentAdded: () => void }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetch(`/api/community/comments?post_id=${postId}`).then(r => r.json())
      .then(d => setComments(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, [postId]);

  const submit = async () => {
    if (!input.trim() || !user) return;
    setPosting(true);
    try {
      const body: any = { post_id: postId, user_id: user.id, user_name: profile?.full_name || 'Student', user_grade: profile?.grade, content: input.trim() };
      if (replyTo) body.parent_comment_id = replyTo.id;
      const res = await fetch('/api/community/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (replyTo) {
        setComments(cs => cs.map(c => c.id === replyTo.id ? { ...c, replies: [...(c.replies || []), data] } : c));
      } else {
        setComments(cs => [...cs, { ...data, replies: [] }]);
        onCommentAdded();
      }
      setInput(''); setReplyTo(null);
    } finally { setPosting(false); }
  };

  return (
    <div className="border-t border-gray-50 bg-gray-50/50">
      {/* Comment list */}
      <div className="px-4 pt-3 space-y-3 max-h-64 overflow-y-auto">
        {loading ? <LoadingSpinner size="sm" /> : comments.map(c => (
          <div key={c.id}>
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {c.user_name?.[0]?.toUpperCase() || 'S'}
              </div>
              <div className="flex-1 bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-gray-800">{c.user_name}</span>
                  {c.user_grade && <span className="text-xs text-gray-400">G{c.user_grade}</span>}
                  <span className="text-xs text-gray-300 ml-auto">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700">{c.content}</p>
                <button onClick={() => setReplyTo(c)} className="text-xs text-blue-500 font-semibold mt-1">Reply</button>
              </div>
            </div>
            {/* Replies */}
            {(c.replies || []).map((r: any) => (
              <div key={r.id} className="flex items-start gap-2.5 ml-9 mt-2">
                <div className="w-6 h-6 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {r.user_name?.[0]?.toUpperCase() || 'S'}
                </div>
                <div className="flex-1 bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-gray-800">{r.user_name}</span>
                    <span className="text-xs text-gray-300 ml-auto">{timeAgo(r.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-700">{r.content}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
        {!loading && comments.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No comments yet. Be the first!</p>}
      </div>
      {/* Input */}
      <div className="px-4 py-3">
        {replyTo && (
          <div className="flex items-center gap-2 mb-2 bg-blue-50 rounded-xl px-3 py-1.5">
            <span className="text-xs text-blue-600 font-medium flex-1">Replying to {replyTo.user_name}</span>
            <button onClick={() => setReplyTo(null)}><X size={12} className="text-blue-400" /></button>
          </div>
        )}
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submit()}
            placeholder={replyTo ? `Reply to ${replyTo.user_name}…` : 'Write a comment…'}
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
          <motion.button whileTap={{ scale: 0.9 }} onClick={submit} disabled={!input.trim() || posting}
            className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center disabled:opacity-40">
            <Send size={14} className="text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Post Sheet ────────────────────────────────────────────────────────
function CreatePostSheet({ onClose }: { onClose: () => void }) {
  const { user, profile } = useAuth();
  const [postType, setPostType] = useState<PostType>('text');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [subjectTag, setSubjectTag] = useState('');
  const [step, setStep] = useState<'compose' | 'visibility'>('compose');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const publish = async () => {
    if (!content.trim() || !user) return;
    setPosting(true); setError('');
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id, user_name: profile?.full_name || 'Student',
          user_grade: profile?.grade, user_school: profile?.school_name,
          user_district: profile?.district, content, post_type: postType,
          subject_tag: subjectTag || null, visibility,
        }),
      });
      if (!res.ok) throw new Error('Failed to post');
      onClose();
    } catch (e: any) { setError(e.message); }
    finally { setPosting(false); }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          {step === 'visibility' ? (
            <button onClick={() => setStep('compose')} className="flex items-center gap-1 text-sm text-gray-600 font-medium">
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <button onClick={onClose} className="text-sm text-gray-500">Cancel</button>
          )}
          <h3 className="font-black text-gray-900">{step === 'compose' ? 'Create Post' : 'Who can see this?'}</h3>
          {step === 'compose' ? (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setStep('visibility')}
              disabled={!content.trim()}
              className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-40">
              Next
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.95 }} onClick={publish} disabled={posting}
              className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-40">
              {posting ? '...' : 'Post'}
            </motion.button>
          )}
        </div>

        <div className="px-5 py-4">
          {step === 'compose' ? (
            <>
              {/* Post type selector */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {POST_TYPES.map(pt => {
                  const Icon = pt.icon;
                  return (
                    <motion.button key={pt.id} whileTap={{ scale: 0.92 }} onClick={() => setPostType(pt.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${
                        postType === pt.id ? `${pt.color} border-current` : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                      <Icon size={13} /> {pt.label}
                    </motion.button>
                  );
                })}
              </div>

              {/* Author info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {profile?.full_name?.[0]?.toUpperCase() || 'S'}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{profile?.full_name || 'Student'}</p>
                  <p className="text-xs text-gray-400">Grade {profile?.grade}{profile?.school_name ? ` · ${profile.school_name}` : ''}</p>
                </div>
              </div>

              {/* Content */}
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={5}
                placeholder={
                  postType === 'achievement' ? "Share your achievement! 🏆 e.g. 'Scored 95% in Physics mock test!'" :
                  postType === 'doubt' ? "What's your question? Be specific about the topic and chapter." :
                  postType === 'note' ? "Share your notes or resources with fellow students..." :
                  "What's on your mind? Share study tips, questions, or updates..."
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none leading-relaxed" />

              {/* Subject tag */}
              <div className="mt-3">
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Subject tag (optional)</label>
                <select value={subjectTag} onChange={e => setSubjectTag(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none appearance-none">
                  <option value="">No tag</option>
                  {(profile?.subjects || []).map((s: string) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
              <p className="text-xs text-gray-400 mt-3 text-right">{content.length}/500</p>
            </>
          ) : (
            /* Visibility selector */
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">Choose who can see this post</p>
              {(Object.entries(VISIBILITY_CONFIG) as [Visibility, any][]).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <motion.button key={key} whileTap={{ scale: 0.97 }} onClick={() => setVisibility(key)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                      visibility === key ? cfg.color + ' border-current' : 'bg-white border-gray-200'
                    }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${visibility === key ? 'bg-current/10' : 'bg-gray-100'}`}>
                      <Icon size={20} className={visibility === key ? '' : 'text-gray-500'} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-bold text-sm ${visibility === key ? '' : 'text-gray-800'}`}>{cfg.label}</p>
                      <p className={`text-xs mt-0.5 ${visibility === key ? 'opacity-70' : 'text-gray-400'}`}>{cfg.desc}</p>
                    </div>
                    {visibility === key && <Check size={18} />}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DISCOVER TAB
// ════════════════════════════════════════════════════════════════════════════
function DiscoverTab() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');

  const QUICK_FILTERS = [
    { id: 'all',        label: 'All'         },
    { id: 'mygrade',    label: 'My Grade'    },
    { id: 'myschool',   label: 'My School'   },
    { id: 'mydistrict', label: 'My District' },
    { id: 'science',    label: 'Science'     },
    { id: 'management', label: 'Management'  },
    { id: 'toprankers', label: '🏆 Top XP'   },
  ];

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/users/discover?limit=20';
      if (search) url += `&name=${encodeURIComponent(search)}`;
      if (gradeFilter) url += `&grade=${gradeFilter}`;
      if (districtFilter) url += `&district=${encodeURIComponent(districtFilter)}`;
      if (activeQuickFilter === 'mygrade') url += `&grade=${profile?.grade || ''}`;
      if (activeQuickFilter === 'myschool') url += `&school=${encodeURIComponent(profile?.school_name || '')}`;
      if (activeQuickFilter === 'mydistrict') url += `&district=${encodeURIComponent(profile?.district || '')}`;
      if (activeQuickFilter === 'science') url += `&stream=Science`;
      if (activeQuickFilter === 'management') url += `&stream=Management`;
      if (activeQuickFilter === 'toprankers') url += `&sort=xp`;
      const data = await fetch(url).then(r => r.json());
      setStudents(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }, [search, gradeFilter, districtFilter, activeQuickFilter, profile]);

  useEffect(() => { doSearch(); }, [activeQuickFilter]);

  return (
    <div className="px-4 pt-3">
      {/* Search bar */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          placeholder="Search students by name, school…"
          className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 shadow-sm" />
        {search && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setSearch(''); doSearch(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={14} className="text-gray-400" />
          </motion.button>
        )}
      </div>

      {/* Quick filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        {QUICK_FILTERS.map(f => (
          <motion.button key={f.id} whileTap={{ scale: 0.92 }} onClick={() => setActiveQuickFilter(f.id)}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
              activeQuickFilter === f.id ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-gray-600 border border-gray-200'
            }`}>
            {f.label}
          </motion.button>
        ))}
      </div>

      {/* Grade + District row */}
      <div className="flex gap-2 mb-4">
        <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
          className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none appearance-none">
          <option value="">Any grade</option>
          {[8,9,10,11,12].map(g => <option key={g} value={g}>Grade {g}</option>)}
        </select>
        <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}
          className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none appearance-none">
          <option value="">Any district</option>
          {['Kathmandu','Lalitpur','Bhaktapur','Kaski','Morang','Rupandehi','Dhanusha','Parsa'].map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <motion.button whileTap={{ scale: 0.9 }} onClick={doSearch}
          className="bg-blue-600 text-white px-4 rounded-xl text-xs font-bold">
          Go
        </motion.button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <StudentCardSkeleton key={i} />)}</div>
      ) : students.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-bold text-gray-700 mb-1">No students found</p>
          <p className="text-gray-400 text-sm">Try different filters</p>
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          {students.map((s: any, i: number) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <StudentCard student={s} onViewProfile={() => navigate(`/user/${s.id}`)} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentCard({ student, onViewProfile }: { student: any; onViewProfile: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start gap-3">
        <motion.button whileTap={{ scale: 0.92 }} onClick={onViewProfile}
          className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-md shadow-blue-200">
          {student.full_name?.[0]?.toUpperCase() || 'S'}
        </motion.button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-bold text-gray-900 text-sm">{student.full_name}</p>
                <AdminBadge userId={student.id} size="sm" />
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xs text-gray-500">Grade {student.grade}</span>
                {student.stream && <><span className="text-gray-300">·</span><span className="text-xs text-gray-500">{student.stream}</span></>}
                {student.district && <><span className="text-gray-300">·</span><span className="text-xs text-gray-400 truncate max-w-[80px]">{student.district}</span></>}
              </div>
              {student.school_name && <p className="text-xs text-gray-400 mt-0.5 truncate">{student.school_name}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-black text-amber-600 flex items-center gap-0.5 justify-end">
                <Zap size={10} fill="currentColor" />{(student.xp_points || 0).toLocaleString()}
              </p>
              {student.streak_count > 0 && (
                <p className="text-xs text-orange-500 flex items-center gap-0.5 justify-end mt-0.5">
                  <Flame size={10} fill="currentColor" />{student.streak_count}d
                </p>
              )}
            </div>
          </div>
          {/* Subjects */}
          {(student.subjects || []).length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {student.subjects.slice(0, 3).map((s: string) => (
                <span key={s} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{s}</span>
              ))}
              {student.subjects.length > 3 && <span className="text-xs text-gray-400">+{student.subjects.length - 3}</span>}
            </div>
          )}
        </div>
      </div>
      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <motion.button whileTap={{ scale: 0.96 }} onClick={onViewProfile}
          className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-blue-200 flex items-center justify-center gap-1.5">
          <Users size={13} /> View Profile
        </motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/study-room')}
          className="flex-1 bg-indigo-50 text-indigo-700 font-bold py-2.5 rounded-xl text-xs border border-indigo-200 flex items-center justify-center gap-1.5">
          <BookOpen size={13} /> Study Room
        </motion.button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// INSTITUTE TAB
// ════════════════════════════════════════════════════════════════════════════
function InstituteTab() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const POST_TYPE_FILTERS = [
    { id: '', label: '📋 All' },
    { id: 'announcement', label: '📢 Notices' },
    { id: 'event',        label: '📅 Events' },
    { id: 'scholarship',  label: '🎓 Scholarships' },
    { id: 'competition',  label: '🏆 Competitions' },
    { id: 'exam',         label: '📝 Exams' },
  ];

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      fetch(`/api/institute-posts${typeFilter ? `?type=${typeFilter}` : ''}`).then(r => r.json()),
      fetch('/api/institutes?limit=10').then(r => r.json()),
    ]).then(([postsRes, instsRes]) => {
      if (postsRes.status === 'fulfilled') setPosts(Array.isArray(postsRes.value) ? postsRes.value : []);
      if (instsRes.status === 'fulfilled') setInstitutes(Array.isArray(instsRes.value) ? instsRes.value : []);
    }).finally(() => setLoading(false));
  }, [typeFilter]);

  const toggleLike = (postId: number) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, like_count: (p.like_count || 0) + (likedPosts.has(postId) ? -1 : 1) } : p));
  };

  return (
    <div>
      {/* Institute strip */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Verified Institutes</p>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {institutes.map(inst => (
            <div key={inst.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md">
                  {inst.name[0]}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                  <BadgeCheck size={8} className="text-white" fill="white" />
                </div>
              </div>
              <p className="text-xs text-gray-600 font-medium text-center max-w-[60px] leading-tight line-clamp-2">{inst.name.split(' ')[0]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Type filter chips */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide sticky top-[105px] bg-gray-50 z-30 pt-1">
        {POST_TYPE_FILTERS.map(f => (
          <motion.button key={f.id} whileTap={{ scale: 0.93 }} onClick={() => setTypeFilter(f.id)}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
              typeFilter === f.id ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-gray-600 border border-gray-200'
            }`}>
            {f.label}
          </motion.button>
        ))}
      </div>

      {/* Posts */}
      <div className="px-4 space-y-3 pb-4">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <PostSkeleton key={i} />)}</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏛️</div>
            <p className="font-bold text-gray-700 mb-1">No posts yet</p>
            <p className="text-gray-400 text-sm">Institute announcements will appear here</p>
          </div>
        ) : (
          posts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <InstitutePostCard post={post} liked={likedPosts.has(post.id)} onLike={() => toggleLike(post.id)} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function InstitutePostCard({ post, liked, onLike }: { post: any; liked: boolean; onLike: () => void }) {
  const [showComments, setShowComments] = useState(false);
  const inst = post.institutes;
  const typeEmoji = POST_TYPE_ICONS[post.post_type] || '📋';

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Pinned badge */}
      {post.pinned && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2">
          <Star size={12} className="text-amber-500" fill="currentColor" />
          <span className="text-xs font-bold text-amber-700">Pinned Post</span>
        </div>
      )}
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-md shadow-blue-200">
          {inst?.name?.[0] || 'I'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-black text-gray-900 text-sm">{inst?.name || 'Institute'}</p>
            <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
              <BadgeCheck size={10} className="text-blue-600" fill="currentColor" />
              <span className="text-xs font-bold text-blue-600">Verified</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {inst?.type && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${INSTITUTE_TYPE_COLORS[inst.type] || 'bg-gray-100 text-gray-600'}`}>
                {inst.type}
              </span>
            )}
            <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
          </div>
        </div>
        <span className="text-xl flex-shrink-0">{typeEmoji}</span>
      </div>
      {/* Content */}
      <div className="px-4 pb-3">
        {post.title && <h3 className="font-black text-gray-900 mb-2 leading-snug">{post.title}</h3>}
        <p className="text-gray-700 text-sm leading-relaxed">{post.content}</p>
        {post.event_date && (
          <div className="flex items-center gap-2 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <Clock size={13} className="text-amber-600" />
            <span className="text-xs font-semibold text-amber-800">
              {new Date(post.event_date).toLocaleDateString('en-NP', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>
      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-50">
        <motion.button whileTap={{ scale: 0.85 }} onClick={onLike}
          className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${liked ? 'text-red-500' : 'text-gray-400'}`}>
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          {post.like_count > 0 && <span>{post.like_count + (liked ? 1 : 0)}</span>}
        </motion.button>
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowComments(s => !s)}
          className={`flex items-center gap-1.5 text-sm font-semibold ${showComments ? 'text-blue-500' : 'text-gray-400'}`}>
          <MessageCircle size={18} />
          {post.comment_count > 0 && <span>{post.comment_count}</span>}
        </motion.button>
        <motion.button whileTap={{ scale: 0.85 }} className="flex items-center gap-1.5 text-sm text-gray-400 ml-auto">
          <Share2 size={18} />
        </motion.button>
      </div>
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <CommentsSection postId={post.id} onCommentAdded={() => {}} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function PostSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded-full w-32 mb-1.5" />
          <div className="h-2.5 bg-gray-100 rounded-full w-48" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-100 rounded-full w-full" />
        <div className="h-3 bg-gray-100 rounded-full w-4/5" />
        <div className="h-3 bg-gray-100 rounded-full w-3/5" />
      </div>
      <div className="flex gap-4">
        <div className="h-7 bg-gray-100 rounded-full w-16" />
        <div className="h-7 bg-gray-100 rounded-full w-16" />
        <div className="h-7 bg-gray-100 rounded-full w-16" />
      </div>
    </div>
  );
}

function StudentCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gray-200 rounded-2xl" />
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded-full w-32 mb-1.5" />
          <div className="h-2.5 bg-gray-100 rounded-full w-48" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-9 bg-gray-100 rounded-xl" />
        <div className="flex-1 h-9 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

function EmptyFeed({ filter, onCreatePost }: { filter: string; onCreatePost: () => void }) {
  const messages: Record<string, { emoji: string; title: string; desc: string }> = {
    all:        { emoji: '📭', title: 'No posts yet',       desc: 'Be the first to share something!' },
    grade:      { emoji: '🎓', title: 'No grade posts',     desc: 'No one in your grade has posted yet.' },
    school:     { emoji: '🏫', title: 'No school posts',    desc: 'Your school community is quiet.' },
    district:   { emoji: '📍', title: 'No district posts',  desc: 'Be the first from your district!' },
    trending:   { emoji: '🔥', title: 'Nothing trending',   desc: 'Start posting to create trends!' },
    bookmarked: { emoji: '🔖', title: 'No saved posts',     desc: 'Bookmark posts to see them here.' },
  };
  const msg = messages[filter] || messages.all;
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{msg.emoji}</div>
      <p className="font-black text-gray-700 text-lg mb-1">{msg.title}</p>
      <p className="text-gray-400 text-sm mb-6 max-w-xs">{msg.desc}</p>
      {filter !== 'bookmarked' && (
        <motion.button whileTap={{ scale: 0.95 }} onClick={onCreatePost}
          className="bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-blue-200 flex items-center gap-2">
          <Plus size={16} /> Create First Post
        </motion.button>
      )}
    </div>
  );
}
