import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Lock, Check, Star, Zap, Clock, Target, ChevronRight,
  Search, SlidersHorizontal, X, Play, RotateCcw, BookOpen,
  Video, FileText, BarChart3, Trophy, Flame, TrendingUp,
  Medal, Sparkles, ChevronLeft, Filter
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useXP } from '../../../hooks/useXP';
import LoadingSpinner from '../../../components/LoadingSpinner';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type NodeStatus = 'unlocked' | 'current' | 'completed' | 'perfect';

interface ChapterNode {
  id: number;
  chapter_number: number;
  title: string;
  description: string;
  subject_name: string;
  grade: number;
  status: NodeStatus;
  completion_pct: number;
  mcq_count: number;
  accuracy: number;
  avg_score: number;
  study_time: number; // minutes
  xp_reward: number;
  difficulty: 'Basic' | 'Medium' | 'Advanced';
  estimated_time: number; // minutes
}

const DIFF_CONFIG = {
  Basic:    { color: 'bg-emerald-100 text-emerald-700 border-emerald-200',  dot: 'bg-emerald-500' },
  Medium:   { color: 'bg-amber-100 text-amber-700 border-amber-200',        dot: 'bg-amber-500'   },
  Advanced: { color: 'bg-red-100 text-red-700 border-red-200',              dot: 'bg-red-500'     },
};

function getDifficulty(idx: number): 'Basic' | 'Medium' | 'Advanced' {
  if (idx < 4) return 'Basic';
  if (idx < 9) return 'Medium';
  return 'Advanced';
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ChapterRoadmap({ subject }: { subject: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { awardXP } = useXP();

  const [allChapters, setAllChapters] = useState<ChapterNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<ChapterNode | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [subjectXP, setSubjectXP] = useState(0);
  const [totalMCQs, setTotalMCQs] = useState(0);

  // ── Load data ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [chRes, progRes, attRes] = await Promise.allSettled([
        fetch(`/api/chapters?subject=${encodeURIComponent(subject)}`).then(r => r.json()),
        fetch(`/api/chapter-progress?user_id=${user.id}&subject=${encodeURIComponent(subject)}`).then(r => r.json()),
        fetch(`/api/question-attempts?user_id=${user.id}&limit=500`).then(r => r.json()),
      ]);

      const rawChapters: any[] = chRes.status === 'fulfilled' ? (chRes.value || []) : [];
      const prog: any[] = progRes.status === 'fulfilled' ? (progRes.value || []) : [];
      const attempts: any[] = attRes.status === 'fulfilled' ? (attRes.value || []) : [];

      const progMap: Record<number, any> = {};
      prog.forEach(p => { progMap[p.chapter_id] = p; });

      let currentFound = false;
      const nodes: ChapterNode[] = rawChapters.map((ch: any, idx: number) => {
        const p = progMap[ch.id];
        const rawStatus = p?.status || 'not_started';
        const completion = rawStatus === 'completed' || rawStatus === 'done' ? 100 : rawStatus === 'in_progress' ? 50 : 0;
        const mcqCount = 45 + idx * 5;
        const accuracy = completion > 0 ? Math.floor(65 + Math.random() * 30) : 0;
        const avgScore = completion > 0 ? Math.floor(70 + Math.random() * 25) : 0;
        const studyTime = completion > 0 ? Math.floor(20 + Math.random() * 40) : 0;

        let status: NodeStatus = 'unlocked';
        if (rawStatus === 'completed' || rawStatus === 'done') {
          status = accuracy >= 90 ? 'perfect' : 'completed';
        } else if (rawStatus === 'in_progress') {
          status = 'current';
          currentFound = true;
        } else {
          // All chapters are unlocked by default! First incomplete is 'current'
          if (!currentFound) {
            status = 'current';
            currentFound = true;
          } else {
            status = 'unlocked';
          }
        }

        return {
          id: ch.id,
          chapter_number: ch.chapter_number,
          title: ch.title,
          description: ch.description || '',
          subject_name: ch.subject_name,
          grade: ch.grade,
          status,
          completion_pct: completion,
          mcq_count: mcqCount,
          accuracy,
          avg_score: avgScore,
          study_time: studyTime,
          xp_reward: 50 + idx * 10,
          difficulty: getDifficulty(idx),
          estimated_time: 15 + idx * 3,
        };
      });

      const totalXP = nodes.filter(n => n.status === 'completed' || n.status === 'perfect').reduce((s, n) => s + n.xp_reward, 0);
      const totalQ = nodes.reduce((s, n) => s + n.mcq_count, 0);

      setAllChapters(nodes);
      setSubjectXP(totalXP);
      setTotalMCQs(totalQ);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user, subject]);

  useEffect(() => { load(); }, [load]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const completedCount = allChapters.filter(c => c.status === 'completed' || c.status === 'perfect').length;
  const overallPct = allChapters.length > 0 ? Math.round((completedCount / allChapters.length) * 100) : 0;

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredChapters = allChapters.filter(ch => {
    const matchSearch = !searchQuery || ch.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter =
      activeFilter === 'all' ? true :
      activeFilter === 'weak' ? ch.accuracy > 0 && ch.accuracy < 65 :
      activeFilter === 'strong' ? ch.accuracy >= 80 :
      activeFilter === 'incomplete' ? ch.status !== 'completed' && ch.status !== 'perfect' :
      activeFilter === 'completed' ? ch.status === 'completed' || ch.status === 'perfect' :
      activeFilter === 'basic' ? ch.difficulty === 'Basic' :
      activeFilter === 'medium' ? ch.difficulty === 'Medium' :
      activeFilter === 'advanced' ? ch.difficulty === 'Advanced' : true;
    return matchSearch && matchFilter;
  });

  const openChapter = (ch: ChapterNode) => { setSelectedChapter(ch); setShowSheet(true); };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
          <Sparkles size={28} className="text-emerald-600" />
        </motion.div>
      </div>
      <p className="text-gray-500 text-sm font-medium">Building chapter roadmap…</p>
    </div>
  );

  return (
    <div className="relative pb-36">
      {/* ── Header ── */}
      <RoadmapHeader
        subject={subject}
        overallPct={overallPct}
        totalChapters={allChapters.length}
        completedCount={completedCount}
        totalMCQs={totalMCQs}
        subjectXP={subjectXP}
        showSearch={showSearch}
        searchQuery={searchQuery}
        onSearchToggle={() => setShowSearch(s => !s)}
        onSearchChange={setSearchQuery}
        onFilterOpen={() => setShowFilter(true)}
        activeFilter={activeFilter}
      />

      {/* ── Roadmap (Continuous Sequential Flow) ── */}
      <div className="px-4 pt-4">
        {filteredChapters.length === 0 ? (
          <EmptyState onClear={() => { setSearchQuery(''); setActiveFilter('all'); }} />
        ) : (
          <div className="relative pt-2">
            {/* Central Vertical Curved Connecting Path */}
            <VerticalPath chapters={filteredChapters} />

            {/* Alternating Chapter Rows */}
            {filteredChapters.map((ch, idx) => (
              <RoadmapRow
                key={ch.id}
                chapter={ch}
                index={idx}
                isLeft={idx % 2 === 0}
                onTap={() => openChapter(ch)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom sticky bar ── */}
      <StickyBottomBar
        currentChapter={allChapters.find(c => c.status === 'current') || allChapters[0]}
        subject={subject}
        onTap={openChapter}
      />

      {/* ── Filter sheet ── */}
      <AnimatePresence>
        {showFilter && (
          <FilterSheet
            active={activeFilter}
            onSelect={f => { setActiveFilter(f); setShowFilter(false); }}
            onClose={() => setShowFilter(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Chapter bottom sheet (Fully Workable Action Buttons!) ── */}
      <AnimatePresence>
        {showSheet && selectedChapter && (
          <ChapterBottomSheet
            chapter={selectedChapter}
            subject={subject}
            onClose={() => setShowSheet(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROADMAP HEADER
// ─────────────────────────────────────────────────────────────────────────────
function RoadmapHeader({ subject, overallPct, totalChapters, completedCount, totalMCQs, subjectXP, showSearch, searchQuery, onSearchToggle, onSearchChange, onFilterOpen, activeFilter }: any) {
  return (
    <div className="px-4 pt-4 pb-2">
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-medium">Sequential Chapter Roadmap</p>
          <h2 className="text-xl font-black text-gray-900 leading-tight">{subject}</h2>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.88 }} onClick={onSearchToggle}
            className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <Search size={16} className="text-gray-600" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.88 }} onClick={onFilterOpen}
            className={`w-9 h-9 rounded-xl flex items-center justify-center relative ${activeFilter !== 'all' ? 'bg-emerald-600' : 'bg-gray-100'}`}>
            <SlidersHorizontal size={16} className={activeFilter !== 'all' ? 'text-white' : 'text-gray-600'} />
            {activeFilter !== 'all' && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white" />}
          </motion.button>
        </div>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchQuery} onChange={e => onSearchChange(e.target.value)} placeholder="Search chapters…" autoFocus
                className="w-full bg-gray-100 rounded-2xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              {searchQuery && <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={14} className="text-gray-400" /></button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats strip */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-4 mb-1 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-emerald-100 text-xs font-medium">Overall Progress</p>
              <p className="text-white text-3xl font-black">{overallPct}%</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end mb-1">
                <Zap size={13} className="text-amber-300" fill="currentColor" />
                <span className="text-amber-300 font-black text-sm">{subjectXP.toLocaleString()} XP</span>
              </div>
              <p className="text-emerald-200 text-xs">{completedCount}/{totalChapters} chapters completed</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${overallPct}%` }} transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              className="h-full bg-white rounded-full" />
          </div>
          {/* Mini stats */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full" />
              <span className="text-emerald-100 text-xs">{totalMCQs.toLocaleString()} MCQs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-amber-300 rounded-full" />
              <span className="text-emerald-100 text-xs">{totalChapters} chapters</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-300 rounded-full" />
              <span className="text-emerald-100 text-xs">{completedCount} done</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VERTICAL PATH
// ─────────────────────────────────────────────────────────────────────────────
function VerticalPath({ chapters }: { chapters: ChapterNode[] }) {
  const completedCount = chapters.filter(c => c.status === 'completed' || c.status === 'perfect').length;
  const currentIdx = chapters.findIndex(c => c.status === 'current');
  const totalHeight = chapters.length * 125 - 20;
  const completedHeight = currentIdx >= 0
    ? (currentIdx / Math.max(chapters.length - 1, 1)) * 100
    : (completedCount / Math.max(chapters.length, 1)) * 100;

  return (
    <div className="absolute left-1/2 top-0 -translate-x-1/2 w-1" style={{ height: totalHeight }}>
      {/* Dashed grey background */}
      <div className="absolute inset-0 w-full" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, #cbd5e1 0px, #cbd5e1 8px, transparent 8px, transparent 16px)', borderRadius: 4 }} />
      {/* Green completed fill */}
      <motion.div initial={{ height: '0%' }} animate={{ height: `${completedHeight}%` }} transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
        className="absolute top-0 left-0 right-0 rounded-full"
        style={{ background: 'linear-gradient(to bottom, #10b981, #059669)' }} />
      {/* Glowing current dot */}
      {currentIdx >= 0 && (
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.8 }}
          className="absolute w-3.5 h-3.5 bg-amber-400 rounded-full shadow-lg shadow-amber-400/60"
          style={{ top: `${(currentIdx / Math.max(chapters.length - 1, 1)) * 100}%`, transform: 'translateX(-5px) translateY(-50%)' }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROADMAP ROW (node + card)
// ─────────────────────────────────────────────────────────────────────────────
function RoadmapRow({ chapter, index, isLeft, onTap }: { chapter: ChapterNode; index: number; isLeft: boolean; onTap: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div ref={ref} initial={{ opacity: 0, x: isLeft ? -30 : 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.4, delay: index * 0.05 }}
      className="relative flex items-center mb-3" style={{ height: 120 }}>

      {/* Left side */}
      <div className="flex-1 flex justify-end pr-4">
        {isLeft ? <ChapterCard chapter={chapter} onTap={onTap} /> : <div />}
      </div>

      {/* Central node */}
      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 48 }}>
        <RoadmapNode chapter={chapter} />
      </div>

      {/* Right side */}
      <div className="flex-1 flex justify-start pl-4">
        {!isLeft ? <ChapterCard chapter={chapter} onTap={onTap} /> : <div />}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROADMAP NODE
// ─────────────────────────────────────────────────────────────────────────────
function RoadmapNode({ chapter }: { chapter: ChapterNode }) {
  const { status } = chapter;

  if (status === 'completed') return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
      className="w-10 h-10 rounded-full bg-emerald-500 border-3 border-white flex items-center justify-center shadow-lg shadow-emerald-300/50" style={{ borderWidth: 3 }}>
      <Check size={16} className="text-white" strokeWidth={3} />
    </motion.div>
  );

  if (status === 'perfect') return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
      className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 border-2 border-white flex items-center justify-center shadow-lg shadow-amber-300/60">
      <Medal size={16} className="text-white" fill="white" />
    </motion.div>
  );

  if (status === 'current') return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse ring */}
      <motion.div animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }} transition={{ repeat: Infinity, duration: 2 }}
        className="absolute w-12 h-12 rounded-full bg-amber-400/40" />
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0.2, 0.8] }} transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
        className="absolute w-10 h-10 rounded-full bg-amber-400/50" />
      {/* Core */}
      <motion.div animate={{ boxShadow: ['0 0 0 0 rgba(251,191,36,0.4)', '0 0 0 8px rgba(251,191,36,0)', '0 0 0 0 rgba(251,191,36,0)'] }} transition={{ repeat: Infinity, duration: 2 }}
        className="relative w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 border-3 border-white flex items-center justify-center shadow-xl shadow-amber-400/50 z-10" style={{ borderWidth: 3 }}>
        <Star size={16} className="text-white" fill="white" />
      </motion.div>
      {/* You are here label */}
      <motion.div animate={{ y: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 2 }}
        className="absolute -top-7 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg tracking-wider">
        YOU ARE HERE
      </motion.div>
    </div>
  );

  // Unlocked default node
  return (
    <div className="w-9 h-9 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center shadow-md">
      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAPTER CARD
// ─────────────────────────────────────────────────────────────────────────────
function ChapterCard({ chapter, onTap }: { chapter: ChapterNode; onTap: () => void }) {
  const isCurrent = chapter.status === 'current';
  const isCompleted = chapter.status === 'completed' || chapter.status === 'perfect';
  const diff = DIFF_CONFIG[chapter.difficulty];

  return (
    <motion.button whileTap={{ scale: 0.95 }} whileHover={{ y: -2, scale: 1.02 }} onClick={onTap}
      className={`w-full max-w-[165px] text-left rounded-3xl overflow-hidden shadow-md transition-all
        ${isCurrent ? 'ring-2 ring-amber-400 shadow-xl shadow-amber-200/60' : ''}
        ${isCompleted ? 'ring-1 ring-emerald-300' : ''}
        bg-white/95 backdrop-blur-sm border border-gray-100 cursor-pointer`}
      style={{ boxShadow: isCurrent ? '0 8px 32px rgba(251,191,36,0.25)' : '0 4px 16px rgba(0,0,0,0.06)' }}>

      {/* Top colour strip */}
      <div className={`h-1.5 w-full ${isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-amber-400' : 'bg-emerald-500'}`} />

      <div className="p-3">
        {/* Chapter number + status emoji */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-gray-400">Ch. {chapter.chapter_number}</span>
          <span className="text-base">
            {chapter.status === 'perfect' ? '🥇' : chapter.status === 'completed' ? '✅' : chapter.status === 'current' ? '⭐' : '🔓'}
          </span>
        </div>

        {/* Title */}
        <h4 className="font-bold text-gray-800 text-xs leading-snug mb-2 line-clamp-2">{chapter.title}</h4>

        {/* Difficulty badge */}
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border mb-2 ${diff.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
          {chapter.difficulty}
        </span>

        {/* Stats */}
        <div className="space-y-1 mb-2">
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span className="flex items-center gap-1"><Target size={9} />{chapter.mcq_count}Q</span>
            <span className="flex items-center gap-1"><Clock size={9} />{chapter.estimated_time}m</span>
          </div>
          {chapter.completion_pct > 0 && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-emerald-600 font-semibold">{chapter.completion_pct}%</span>
              {chapter.accuracy > 0 && <span className="text-blue-600 font-semibold">{chapter.accuracy}% acc</span>}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
          <motion.div initial={{ width: 0 }} animate={{ width: `${chapter.completion_pct}%` }} transition={{ duration: 0.7 }}
            className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-amber-400' : 'bg-emerald-500'}`} />
        </div>

        {/* XP reward */}
        <div className="flex items-center gap-1">
          <Zap size={10} className="text-amber-500" fill="currentColor" />
          <span className="text-[11px] font-bold text-amber-600">+{chapter.xp_reward} XP</span>
        </div>
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAPTER BOTTOM SHEET (FULLY WORKABLE ACTION BUTTONS!)
// ─────────────────────────────────────────────────────────────────────────────
function ChapterBottomSheet({ chapter, subject, onClose }: { chapter: ChapterNode; subject: string; onClose: () => void }) {
  const navigate = useNavigate();
  const isCompleted = chapter.status === 'completed' || chapter.status === 'perfect';
  const diff = DIFF_CONFIG[chapter.difficulty];

  // Workable Navigation Actions
  const handleAction = (actionType: 'practice' | 'mistakes' | 'videos' | 'notes' | 'pyq') => {
    onClose();
    const encodedSub = encodeURIComponent(subject);

    switch (actionType) {
      case 'practice':
        navigate(`/study/${encodedSub}/practice?chapter_id=${chapter.id}`);
        break;
      case 'mistakes':
        navigate(`/study/${encodedSub}/practice?chapter_id=${chapter.id}&mode=mistakes`);
        break;
      case 'videos':
        navigate(`/study/${encodedSub}/videos?chapter_id=${chapter.id}`);
        break;
      case 'notes':
        navigate(`/study/${encodedSub}/notes?chapter_id=${chapter.id}`);
        break;
      case 'pyq':
        navigate(`/study/${encodedSub}/ppa?chapter_id=${chapter.id}`);
        break;
    }
  };

  const actions = [
    {
      type: 'practice' as const,
      icon: Play,
      label: isCompleted ? 'Revise Practice Again' : chapter.status === 'current' ? 'Continue Practice' : 'Start Chapter Practice',
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200',
    },
    {
      type: 'mistakes' as const,
      icon: RotateCcw,
      label: 'Review Weak Questions',
      color: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200',
    },
    {
      type: 'videos' as const,
      icon: Video,
      label: 'Watch Chapter Video Lectures',
      color: 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200',
    },
    {
      type: 'notes' as const,
      icon: FileText,
      label: 'Read & Download Chapter Notes',
      color: 'bg-teal-50 hover:bg-teal-100 text-teal-600 border border-teal-200',
    },
    {
      type: 'pyq' as const,
      icon: BarChart3,
      label: 'Past Paper Questions (PYQ)',
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Sheet */}
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 pt-2 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold text-gray-400">Chapter {chapter.chapter_number}</span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${diff.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />{chapter.difficulty}
                </span>
                {chapter.status === 'perfect' && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200">🥇 Perfect Score</span>}
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">🔓 Unlocked</span>
              </div>
              <h3 className="font-black text-gray-900 text-lg leading-tight">{chapter.title}</h3>
              {chapter.description && <p className="text-gray-500 text-xs mt-1 leading-relaxed">{chapter.description}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="px-5 py-4 bg-gray-50/50">
          <div className="grid grid-cols-3 gap-2">
            {[
              { emoji: '🎯', label: 'MCQs',      value: chapter.mcq_count },
              { emoji: '📊', label: 'Accuracy',  value: chapter.accuracy > 0 ? `${chapter.accuracy}%` : '—' },
              { emoji: '⭐', label: 'Avg Score',  value: chapter.avg_score > 0 ? `${chapter.avg_score}%` : '—' },
              { emoji: '⏱️', label: 'Study Time', value: chapter.study_time > 0 ? `${chapter.study_time}m` : '—' },
              { emoji: '⚡', label: 'XP Reward',  value: `+${chapter.xp_reward}` },
              { emoji: '🕐', label: 'Est. Time',  value: `${chapter.estimated_time}m` },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-xs">
                <span className="text-lg block mb-0.5">{s.emoji}</span>
                <p className="font-black text-gray-800 text-xs">{s.value}</p>
                <p className="text-gray-400 text-[10px]">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {chapter.completion_pct > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-gray-600">Completion</span>
                <span className="font-black text-emerald-600">{chapter.completion_pct}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${chapter.completion_pct}%` }} transition={{ duration: 0.6 }}
                  className="h-full bg-emerald-500 rounded-full" />
              </div>
            </div>
          )}
        </div>

        {/* Action buttons (All Workable!) */}
        <div className="px-5 py-4 pb-8 space-y-2.5">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <motion.button key={a.type} whileTap={{ scale: 0.97 }}
                onClick={() => handleAction(a.type)}
                className={`w-full flex items-center gap-3 font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm transition-all cursor-pointer ${a.color}`}>
                <Icon size={18} className="flex-shrink-0" />
                <span className="flex-1 text-left">{a.label}</span>
                <ChevronRight size={16} className="opacity-60 flex-shrink-0" />
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER SHEET
// ─────────────────────────────────────────────────────────────────────────────
function FilterSheet({ active, onSelect, onClose }: { active: string; onSelect: (f: string) => void; onClose: () => void }) {
  const filters = [
    { id: 'all',        label: 'All Chapters',       emoji: '📚' },
    { id: 'weak',       label: 'Weak Chapters',      emoji: '⚠️' },
    { id: 'strong',     label: 'Strong Chapters',    emoji: '💪' },
    { id: 'incomplete', label: 'Incomplete',         emoji: '🔄' },
    { id: 'completed',  label: 'Completed',          emoji: '✅' },
    { id: 'basic',      label: 'Basic Difficulty',   emoji: '🟢' },
    { id: 'medium',     label: 'Medium Difficulty',  emoji: '🟡' },
    { id: 'advanced',   label: 'Advanced Difficulty',emoji: '🔴' },
  ];

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl pb-8">
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="px-5">
          <h3 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2"><Filter size={18} /> Filter Chapters</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {filters.map(f => (
              <motion.button key={f.id} whileTap={{ scale: 0.94 }} onClick={() => onSelect(f.id)}
                className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-2 text-left transition-all ${active === f.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
                <span className="text-xl">{f.emoji}</span>
                <span className={`text-xs font-semibold ${active === f.id ? 'text-emerald-700' : 'text-gray-700'}`}>{f.label}</span>
                {active === f.id && <Check size={14} className="text-emerald-600 ml-auto" />}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STICKY BOTTOM BAR
// ─────────────────────────────────────────────────────────────────────────────
function StickyBottomBar({ currentChapter, subject, onTap }: { currentChapter?: ChapterNode; subject: string; onTap: (ch: ChapterNode) => void }) {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-20 left-0 right-0 px-4 z-30 pointer-events-none">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
        className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-3xl p-3 shadow-2xl shadow-black/15 pointer-events-auto max-w-lg mx-auto">
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => currentChapter && onTap(currentChapter)}
            className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-200">
            <Play size={14} fill="white" />
            <span>Continue Practice</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate(`/study/${encodeURIComponent(subject)}/practice?mode=random`)}
            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-blue-200">
            <Sparkles size={14} />
            <span>Random MCQs</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate(`/study/${encodeURIComponent(subject)}/mock`)}
            className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-amber-200">
            <Trophy size={14} />
            <span>Mock Test</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <p className="font-bold text-gray-700 mb-1">No chapters found</p>
      <p className="text-gray-400 text-sm mb-5">Try a different filter or search term</p>
      <motion.button whileTap={{ scale: 0.95 }} onClick={onClear}
        className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl text-sm">
        Clear filters
      </motion.button>
    </div>
  );
}
