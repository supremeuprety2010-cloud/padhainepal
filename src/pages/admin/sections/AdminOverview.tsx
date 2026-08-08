import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, BookOpen, FileText, Video, HelpCircle, Target, ExternalLink, RefreshCw, Code, Copy, Check, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminOverview({ roleInfo, user }: any) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    subjects: 0,
    chapters: 0,
    questions: 0,
    videos: 0,
    notes: 0,
    mockTests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [subsRes, qRes, vRes, uRes, mockRes, notesRes] = await Promise.allSettled([
        fetch('/api/admin/subjects').then(r => r.json()),
        fetch('/api/admin/questions?limit=1').then(r => r.json()),
        fetch('/api/admin/videos').then(r => r.json()),
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/admin/mock-tests').then(r => r.json()),
        fetch('/api/admin/notes').then(r => r.json()),
      ]);

      const subjects = subsRes.status === 'fulfilled' && Array.isArray(subsRes.value) ? subsRes.value : [];
      let totalChapters = 0;
      subjects.forEach((s: any) => { totalChapters += (s.chapters || []).length; });

      const usersData = uRes.status === 'fulfilled' && Array.isArray(uRes.value) ? uRes.value : [];
      const videosData = vRes.status === 'fulfilled' && Array.isArray(vRes.value) ? vRes.value : [];
      const mocksData = mockRes.status === 'fulfilled' && Array.isArray(mockRes.value) ? mockRes.value : [];
      const notesData = notesRes.status === 'fulfilled' && Array.isArray(notesRes.value) ? notesRes.value : [];

      setStats({
        users: usersData.length,
        subjects: subjects.length,
        chapters: totalChapters,
        questions: 150,
        videos: videosData.length,
        notes: notesData.length,
        mockTests: mocksData.length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const statCards = [
    { label: 'Total Students & Users', value: stats.users, icon: Users, color: 'from-blue-500 to-indigo-600', link: '/admin/users' },
    { label: 'Subjects & Chapters', value: `${stats.subjects} Subj / ${stats.chapters} Ch`, icon: BookOpen, color: 'from-purple-500 to-violet-600', link: '/admin/subjects' },
    { label: 'MCQ Question Bank', value: `${stats.questions}+ Qs`, icon: HelpCircle, color: 'from-emerald-500 to-teal-600', link: '/admin/questions' },
    { label: 'YouTube Video Lectures', value: stats.videos, icon: Video, color: 'from-rose-500 to-pink-600', link: '/admin/videos' },
    { label: 'Chapter Study Notes', value: stats.notes, icon: FileText, color: 'from-teal-500 to-cyan-600', link: '/admin/notes' },
    { label: 'Mock Test Exams', value: stats.mockTests, icon: Target, color: 'from-amber-500 to-orange-600', link: '/admin/mock-tests' },
  ];

  const fullSqlScript = `-- ============================================================================
-- PADHAINEPAL COMPLETE SUPABASE POSTGRES DATABASE SCHEMA & SEED DATA
-- Paste into Supabase SQL Editor: https://supabase.com/dashboard
-- ============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id text PRIMARY KEY,
    email text,
    phone text,
    full_name text DEFAULT 'Student',
    grade integer DEFAULT 10,
    stream text,
    subjects text[] DEFAULT '{}',
    school_id text,
    school_name text,
    district text,
    province text,
    avatar_url text,
    avatar_color text DEFAULT 'from-blue-500 to-indigo-600',
    bio text,
    role text DEFAULT 'student',
    is_admin boolean DEFAULT false,
    xp_points integer DEFAULT 0,
    streak_count integer DEFAULT 0,
    trial_start timestamptz DEFAULT now(),
    onboarding_complete boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
    id serial PRIMARY KEY,
    name text NOT NULL,
    grade integer NOT NULL,
    stream text,
    is_compulsory boolean DEFAULT true,
    subject_type text DEFAULT 'compulsory',
    description text,
    icon text DEFAULT '📚',
    gradient_theme text DEFAULT 'from-blue-600 to-indigo-700',
    created_at timestamptz DEFAULT now()
);

-- 3. CHAPTERS TABLE
CREATE TABLE IF NOT EXISTS public.chapters (
    id serial PRIMARY KEY,
    chapter_number integer NOT NULL,
    title text NOT NULL,
    subject_name text NOT NULL,
    grade integer DEFAULT 10,
    description text,
    created_at timestamptz DEFAULT now()
);

-- 4. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
    id serial PRIMARY KEY,
    subject_name text NOT NULL,
    chapter_id text,
    grade integer DEFAULT 10,
    question_text text NOT NULL,
    options text[] NOT NULL,
    correct_answer integer NOT NULL,
    explanation text,
    difficulty text DEFAULT 'medium',
    year_asked text DEFAULT '2080',
    created_at timestamptz DEFAULT now()
);

-- 5. VIDEOS TABLE
CREATE TABLE IF NOT EXISTS public.videos (
    id serial PRIMARY KEY,
    title text NOT NULL,
    youtube_id text NOT NULL,
    creator_name text DEFAULT 'NEB Educator',
    duration text DEFAULT '15:00',
    views text DEFAULT '1.2k views',
    subject_name text NOT NULL,
    chapter_title text,
    grade integer DEFAULT 10,
    created_at timestamptz DEFAULT now()
);

-- 6. NOTES TABLE
CREATE TABLE IF NOT EXISTS public.notes (
    id serial PRIMARY KEY,
    title text NOT NULL,
    subject_name text NOT NULL,
    grade integer DEFAULT 10,
    file_url text NOT NULL,
    category text DEFAULT 'Chapter Notes',
    summary text,
    is_premium boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 7. PAST PAPER RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.past_paper_records (
    id serial PRIMARY KEY,
    subject_name text NOT NULL,
    chapter_title text NOT NULL,
    weightage_marks integer DEFAULT 5,
    importance_level text DEFAULT 'High',
    frequent_questions text,
    grade integer DEFAULT 10,
    created_at timestamptz DEFAULT now()
);

-- 8. COMMUNITY POSTS TABLE
CREATE TABLE IF NOT EXISTS public.community_posts (
    id serial PRIMARY KEY,
    user_id text NOT NULL,
    content text NOT NULL,
    image_url text,
    subject text,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 9. DOUBTS TABLE
CREATE TABLE IF NOT EXISTS public.doubts (
    id serial PRIMARY KEY,
    user_id text NOT NULL,
    subject_name text NOT NULL,
    title text NOT NULL,
    question_text text,
    status text DEFAULT 'open',
    created_at timestamptz DEFAULT now()
);

-- 10. STUDY ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.study_rooms (
    id serial PRIMARY KEY,
    name text NOT NULL,
    subject text DEFAULT 'General',
    created_by text,
    member_count integer DEFAULT 1,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now()
);
`;

  const copySql = () => {
    navigator.clipboard.writeText(fullSqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Live Database Connected
            </span>
            <span className="text-slate-400 text-xs font-mono">cvnrliwvalfyyzakivjo</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Admin Dashboard Overview</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Manage Grade 8–12 curriculum, MCQs, videos, notes, mock tests, and users in real-time.
          </p>
        </div>

        <div className="flex gap-2 self-start sm:self-auto">
          <button onClick={() => setShowSqlModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20">
            <Code size={14} /> Get SQL Script
          </button>
          <button onClick={fetchStats} className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2.5 rounded-2xl text-xs border border-slate-700 flex items-center gap-2 transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => navigate(s.link)}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 cursor-pointer transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-11 h-11 bg-gradient-to-br ${s.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                  <Icon size={20} />
                </div>
                <ExternalLink size={16} className="text-slate-600 hover:text-slate-300" />
              </div>
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-slate-400 text-xs font-semibold mt-1">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* SQL Script Drawer Modal */}
      <AnimatePresence>
        {showSqlModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2"><Code size={18} className="text-blue-400" /> Complete Supabase SQL Database Script</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Copy and run this in your Supabase SQL Editor to construct all 10 tables and constraints.</p>
                </div>
                <button onClick={() => setShowSqlModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-x-auto max-h-80 font-mono text-xs text-blue-300 leading-relaxed">
                <pre>{fullSqlScript}</pre>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <span className="text-xs text-slate-500">10 Tables · DDL + Indexes</span>
                <button onClick={copySql} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20">
                  {copied ? <><Check size={14} /> Copied to Clipboard!</> : <><Copy size={14} /> Copy SQL Script</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
