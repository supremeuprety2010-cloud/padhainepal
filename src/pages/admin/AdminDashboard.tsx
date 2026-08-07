import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, FileText, Video, HelpCircle, Target,
  BarChart3, Users, Shield, Lock, ExternalLink, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

// Sub-components for Admin sections
import AdminOverview from './sections/AdminOverview';
import AdminSubjects from './sections/AdminSubjects';
import AdminNotes from './sections/AdminNotes';
import AdminVideos from './sections/AdminVideos';
import AdminQuestions from './sections/AdminQuestions';
import AdminMockTests from './sections/AdminMockTests';
import AdminPPA from './sections/AdminPPA';
import AdminUsers from './sections/AdminUsers';

// Designated Superadmin User IDs for client-side instant bypass
const SUPERADMIN_IDS = ['af8c2244-2be1-4032-8ba4-8cc46f06de5f'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();

  const isSuperadminId = Boolean(user?.id && SUPERADMIN_IDS.includes(user.id));

  const [roleInfo, setRoleInfo] = useState<{ isAdmin: boolean; isTeacher: boolean; role: string; schoolId: string | null }>({
    isAdmin: isSuperadminId,
    isTeacher: false,
    role: isSuperadminId ? 'admin' : 'student',
    schoolId: null,
  });
  const [checkingRole, setCheckingRole] = useState(!isSuperadminId);

  // Check admin role
  const checkRole = useCallback(async () => {
    if (!user) return;
    if (SUPERADMIN_IDS.includes(user.id)) {
      setRoleInfo({ isAdmin: true, isTeacher: false, role: 'admin', schoolId: null });
      setCheckingRole(false);
      return;
    }
    setCheckingRole(true);
    try {
      const res = await fetch(`/api/admin/auth?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setRoleInfo(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingRole(false);
    }
  }, [user]);

  useEffect(() => { checkRole(); }, [checkRole]);

  const navItems = [
    { path: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/subjects', label: 'Subjects & Chapters', icon: BookOpen },
    { path: '/admin/notes', label: 'Notes & PDFs', icon: FileText },
    { path: '/admin/videos', label: 'YouTube Videos', icon: Video },
    { path: '/admin/questions', label: 'MCQ Question Bank', icon: HelpCircle },
    { path: '/admin/mock-tests', label: 'Mock Test Builder', icon: Target },
    { path: '/admin/ppa', label: 'Past Paper Data', icon: BarChart3 },
    { path: '/admin/users', label: 'Users & Roles', icon: Users },
  ];

  if (checkingRole) return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <LoadingSpinner size="lg" text="Verifying Admin Access…" />
    </div>
  );

  // Protected check (superadmin ID bypasses immediately)
  if (!isSuperadminId && !roleInfo.isAdmin && !roleInfo.isTeacher) return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
        <Lock size={32} />
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Access Denied</h1>
      <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
        The Admin Panel is restricted to administrators and authorized teachers. Your account does not have admin permissions.
      </p>
      <div className="flex gap-3">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/home')} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-lg shadow-blue-500/20">
          Return to Student App
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={checkRole} className="bg-slate-800 text-slate-300 hover:text-white font-bold px-4 py-3 rounded-2xl text-sm border border-slate-700 flex items-center gap-1.5">
          <RefreshCw size={14} /> Re-verify
        </motion.button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col">
        {/* Header / Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/home')}>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="font-black text-white text-base leading-none">PadhaiNepal</p>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mt-0.5">Admin Console</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/home')} className="md:hidden p-2 text-slate-400 hover:text-white" title="Student App">
            <ExternalLink size={16} />
          </motion.button>
        </div>

        {/* User Role Badge */}
        <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              {profile?.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate max-w-[110px]">{profile?.full_name || 'Admin'}</p>
              <p className="text-[10px] text-emerald-400 font-semibold capitalize">{roleInfo.role || 'admin'}</p>
            </div>
          </div>
          <button onClick={() => navigate('/home')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg">
            App <ExternalLink size={10} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path) || (item.path === '/admin/overview' && location.pathname === '/admin');
            return (
              <NavLink key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}>
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          CDC / NEB Admin • Grades 8–12
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
        <Routes>
          <Route index element={<AdminOverview roleInfo={roleInfo} user={user} />} />
          <Route path="overview" element={<AdminOverview roleInfo={roleInfo} user={user} />} />
          <Route path="subjects" element={<AdminSubjects roleInfo={roleInfo} user={user} />} />
          <Route path="notes" element={<AdminNotes roleInfo={roleInfo} user={user} />} />
          <Route path="videos" element={<AdminVideos roleInfo={roleInfo} user={user} />} />
          <Route path="questions" element={<AdminQuestions roleInfo={roleInfo} user={user} />} />
          <Route path="mock-tests" element={<AdminMockTests roleInfo={roleInfo} user={user} />} />
          <Route path="ppa" element={<AdminPPA roleInfo={roleInfo} user={user} />} />
          <Route path="users" element={<AdminUsers roleInfo={roleInfo} user={user} />} />
          <Route path="*" element={<AdminOverview roleInfo={roleInfo} user={user} />} />
        </Routes>
      </main>
    </div>
  );
}
