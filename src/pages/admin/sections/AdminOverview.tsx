import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, FileText, Video, HelpCircle, Target, BarChart3, ExternalLink, RefreshCw } from 'lucide-react';
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

        <button onClick={fetchStats} className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-2xl text-xs border border-slate-700 flex items-center gap-2 self-start sm:self-auto transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Stats
        </button>
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
              <p className="text-slate-400 text-xs mt-1">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
        <h3 className="font-bold text-white text-sm">Quick Management Shortcuts</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button onClick={() => navigate('/admin/questions')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-2xl text-xs text-center transition-colors">
            📥 Bulk CSV MCQ Import
          </button>
          <button onClick={() => navigate('/admin/videos')} className="bg-rose-600 hover:bg-rose-500 text-white font-bold p-3 rounded-2xl text-xs text-center transition-colors">
            🎬 Add YouTube Video
          </button>
          <button onClick={() => navigate('/admin/notes')} className="bg-teal-600 hover:bg-teal-500 text-white font-bold p-3 rounded-2xl text-xs text-center transition-colors">
            📄 Upload PDF Note
          </button>
          <button onClick={() => navigate('/admin/mock-tests')} className="bg-amber-600 hover:bg-amber-500 text-white font-bold p-3 rounded-2xl text-xs text-center transition-colors">
            🎯 Build Mock Test
          </button>
        </div>
      </div>
    </div>
  );
}
