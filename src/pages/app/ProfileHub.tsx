import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, BarChart3, Award, Bookmark, Settings, LogOut,
  Crown, Flame, Zap, Trophy, ChevronRight, Check, TrendingUp,
  Bell, Lock, CreditCard, Trash2, Download, Edit3, Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import supabase from '../../lib/supabase';
import AppHeader from '../../components/AppHeader';
import GlassCard from '../../components/GlassCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import AdminBadge from '../../components/AdminBadge';
import { SUBSCRIPTION_PRICES } from '../../lib/constants';

type ProfileTab = 'overview' | 'report' | 'achievements' | 'saved' | 'settings';

export default function ProfileHub() {
  const [tab, setTab] = useState<ProfileTab>('overview');
  const tabs = [
    { id: 'overview' as ProfileTab,      icon: User,      label: 'Overview'  },
    { id: 'report' as ProfileTab,        icon: BarChart3, label: 'Report'    },
    { id: 'achievements' as ProfileTab,  icon: Award,     label: 'Awards'    },
    { id: 'saved' as ProfileTab,         icon: Bookmark,  label: 'Saved'     },
    { id: 'settings' as ProfileTab,      icon: Settings,  label: 'Settings'  },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <AppHeader title="Profile" showActions={false} />
      <div className="pt-14">
        {/* Tab scroll */}
        <div className="px-4 pt-3 pb-0 overflow-x-auto">
          <div className="flex gap-1 min-w-max bg-gray-100 rounded-2xl p-1">
            {tabs.map(({ id, icon: Icon, label }) => (
              <motion.button key={id} whileTap={{ scale: 0.95 }} onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${tab === id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                <Icon size={13} /> {label}
              </motion.button>
            ))}
          </div>
        </div>
        <div className="px-4 pt-4">
          {tab === 'overview'     && <OverviewTab />}
          {tab === 'report'       && <ReportTab />}
          {tab === 'achievements' && <AchievementsTab />}
          {tab === 'saved'        && <SavedTab />}
          {tab === 'settings'     && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}

// ── Overview ───────────────────────────────────────────────────────────────────
function OverviewTab() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const grade = profile?.grade || 10;
  const price = SUBSCRIPTION_PRICES[grade];

  const trialLeft = () => {
    if (!profile?.trial_start) return 3;
    const diff = Math.ceil(3 - (Date.now() - new Date(profile.trial_start).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <motion.div whileTap={{ scale: 0.95 }} onClick={() => navigate(`/user/${user?.id}`)} className="cursor-pointer flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
            ) : (
              <div className={`w-16 h-16 bg-gradient-to-br ${profile?.avatar_color || 'from-blue-500 to-indigo-600'} rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg`}>
                {profile?.full_name?.[0]?.toUpperCase() || 'S'}
              </div>
            )}
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-gray-900 text-lg">{profile?.full_name || 'Student'}</h2>
              <AdminBadge userId={user?.id} role={profile?.role} size="sm" />
            </div>
            <p className="text-gray-500 text-sm">{user?.email || user?.phone}</p>
            {profile?.bio && <p className="text-gray-400 text-xs mt-0.5 italic line-clamp-1">"{profile.bio}"</p>}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">Grade {profile?.grade}</span>
              {profile?.stream && <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">{profile.stream}</span>}
            </div>
          </div>
          <button onClick={() => navigate('/profile/edit')} className="w-9 h-9 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center">
            <Edit3 size={15} className="text-blue-600" />
          </button>
        </div>
        {/* View public profile link */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(`/user/${user?.id}`)}
          className="w-full mt-3 bg-gray-50 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5">
          👁 View Public Profile
        </motion.button>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-3.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-1"><Zap size={14} className="text-amber-500" /></div>
          <p className="text-xl font-black text-gray-800">{(profile?.xp_points || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400">XP Points</p>
        </GlassCard>
        <GlassCard className="p-3.5 text-center border-x border-gray-100">
          <div className="flex items-center justify-center gap-1 mb-1"><Flame size={14} className="text-orange-500" /></div>
          <p className="text-xl font-black text-gray-800">{profile?.streak_count || 0}</p>
          <p className="text-xs text-gray-400">Day Streak</p>
        </GlassCard>
        <GlassCard className="p-3.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-1"><Trophy size={14} className="text-yellow-500" /></div>
          <p className="text-xl font-black text-gray-800">#--</p>
          <p className="text-xs text-gray-400">Rank</p>
        </GlassCard>
      </div>

      {/* Subscription */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center"><Crown size={18} className="text-amber-600" /></div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 text-sm">Subscription</h3>
            <p className="text-xs text-gray-400">{trialLeft() > 0 ? `Free trial · ${trialLeft()} days left` : 'Trial ended'}</p>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/subscribe')}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-2xl text-sm shadow-lg shadow-amber-200">
          Upgrade · NPR {price?.toLocaleString()}/year
        </motion.button>
      </GlassCard>

      {/* Info */}
      <GlassCard className="p-4 space-y-3">
        {[
          ['🏫', 'School', profile?.school_name || 'Not set'],
          ['📍', 'Location', profile?.district ? `${profile.district}, ${profile.province}` : 'Not set'],
          ['📚', 'Subjects', (profile?.subjects || []).slice(0, 3).join(', ') + ((profile?.subjects?.length || 0) > 3 ? '...' : '') || 'None'],
        ].map(([emoji, label, value]) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-lg w-8 text-center">{emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
            </div>
          </div>
        ))}
      </GlassCard>

      {/* Links */}
      <GlassCard className="divide-y divide-gray-100">
        {[
          ['Admin Console', Shield, '/admin'],
          ['Leaderboard', Trophy, '/leaderboard'],
          ['Study Room', User, '/study-room'],
        ].map(([l, Icon, path]) => (
          <motion.button key={l as string} whileTap={{ scale: 0.98 }} onClick={() => navigate(path as string)} className="w-full flex items-center gap-3 p-4">
            <span className={`w-8 h-8 ${path === '/admin' ? 'bg-amber-100 text-amber-700 font-bold' : 'bg-gray-100 text-gray-500'} rounded-xl flex items-center justify-center`}>
              <Icon size={16} />
            </span>
            <span className={`flex-1 text-sm font-medium text-left ${path === '/admin' ? 'font-bold text-amber-900' : 'text-gray-700'}`}>{l as string}</span>
            <ChevronRight size={16} className="text-gray-400" />
          </motion.button>
        ))}
      </GlassCard>

      {/* PROMINENT LOG OUT BUTTON ON OVERVIEW TAB */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
      >
        {loggingOut ? (
          <div className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
        ) : (
          <>
            <LogOut size={18} />
            <span>Sign Out / Log Out</span>
          </>
        )}
      </motion.button>
    </div>
  );
}

// ── Report Card ────────────────────────────────────────────────────────────────
function ReportTab() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/test-attempts?user_id=${user.id}&limit=20`).then(r => r.json())
      .then(d => setAttempts(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const avg = attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / attempts.length) : 0;
  const best = attempts.length > 0 ? Math.max(...attempts.map(a => a.score || 0)) : 0;
  const subjectMap: Record<string, number[]> = {};
  attempts.forEach(a => { if (a.subject) { if (!subjectMap[a.subject]) subjectMap[a.subject] = []; subjectMap[a.subject].push(a.score || 0); }});

  if (loading) return <LoadingSpinner size="lg" text="Loading report..." />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[['📊', `${avg}%`, 'Avg Score'], ['🏆', `${best}%`, 'Best Score'], ['📝', attempts.length, 'Tests Taken']].map(([e, v, l]) => (
          <GlassCard key={l as string} className="p-3.5 text-center">
            <div className="text-xl mb-1">{e}</div>
            <p className="text-lg font-black text-gray-800">{v}</p>
            <p className="text-xs text-gray-400">{l as string}</p>
          </GlassCard>
        ))}
      </div>

      {Object.keys(subjectMap).length > 0 && (
        <GlassCard className="p-4">
          <h3 className="font-bold text-gray-800 mb-3 text-sm">Performance by Subject</h3>
          <div className="space-y-3">
            {Object.entries(subjectMap).map(([subj, scores]) => {
              const avg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
              return (
                <div key={subj}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{subj}</span>
                    <span className="font-bold text-gray-600">{avg}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${avg}%` }} transition={{ duration: 0.5 }}
                      className={`h-full rounded-full ${avg >= 80 ? 'bg-green-500' : avg >= 60 ? 'bg-blue-500' : 'bg-amber-500'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      <GlassCard className="p-4">
        <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-1.5"><TrendingUp size={14} className="text-blue-500" /> Recent Tests</h3>
        <div className="space-y-2">
          {attempts.slice(0, 8).map((a: any) => (
            <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-700">{a.subject || a.mode || 'Practice'}</p>
                <p className="text-xs text-gray-400">{new Date(a.submitted_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-sm font-black px-2.5 py-1 rounded-full ${(a.score || 0) >= 80 ? 'bg-green-100 text-green-700' : (a.score || 0) >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                {a.score || 0}%
              </span>
            </div>
          ))}
          {attempts.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No tests yet. Start practicing!</p>}
        </div>
      </GlassCard>
    </div>
  );
}

// ── Achievements ───────────────────────────────────────────────────────────────
function AchievementsTab() {
  const ALL_ACHIEVEMENTS = [
    { key: 'first_login',     icon: '👋', title: 'Welcome!',          desc: 'Logged in for the first time',      xp: 10,  earned: true },
    { key: 'first_mcq',       icon: '🎯', title: 'First MCQ',         desc: 'Answered your first question',      xp: 20,  earned: true },
    { key: 'streak_7',        icon: '🔥', title: '7-Day Streak',      desc: 'Studied 7 days in a row',           xp: 100, earned: false },
    { key: 'streak_30',       icon: '⚡', title: '30-Day Warrior',    desc: 'Studied 30 days in a row',          xp: 500, earned: false },
    { key: 'perfect_test',    icon: '💯', title: 'Perfect Score',     desc: 'Got 100% on a mock test',           xp: 200, earned: false },
    { key: 'chapter_done_5',  icon: '📚', title: 'Chapter Master',    desc: 'Completed 5 chapters',              xp: 150, earned: false },
    { key: 'top_10',          icon: '🏆', title: 'Top 10',            desc: 'Reached top 10 on leaderboard',     xp: 300, earned: false },
    { key: 'pomodoro_10',     icon: '🍅', title: 'Focus Champion',    desc: 'Completed 10 Pomodoro sessions',    xp: 100, earned: false },
    { key: 'doubt_answered',  icon: '💡', title: 'Helper',            desc: 'Answered a classmate\'s doubt',     xp: 50,  earned: false },
    { key: 'mcq_100',         icon: '🎮', title: 'Century',           desc: 'Answered 100 MCQs correctly',       xp: 250, earned: false },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {ALL_ACHIEVEMENTS.map(a => (
          <GlassCard key={a.key} className={`p-4 ${!a.earned ? 'opacity-50' : ''}`}>
            <div className="text-3xl mb-2">{a.icon}</div>
            <p className="font-bold text-gray-800 text-sm">{a.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{a.desc}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-bold text-amber-600">+{a.xp} XP</span>
              {a.earned && <span className="text-green-500 text-xs font-bold">✓ Earned</span>}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

// ── Saved ──────────────────────────────────────────────────────────────────────
function SavedTab() {
  const { user } = useAuth();
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    fetch(`/api/saved?user_id=${user.id}`).then(r => r.json())
      .then(d => setSaved(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const filtered = filter === 'all' ? saved : saved.filter(s => s.item_type === filter);

  if (loading) return <LoadingSpinner size="lg" />;
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[['all','All'],['question','MCQs'],['video','Videos'],['note','Notes']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${filter === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map((s: any) => (
          <GlassCard key={s.id} className="p-4 flex items-center gap-3">
            <span className="text-xl">{s.item_type === 'question' ? '❓' : s.item_type === 'video' ? '🎬' : '📝'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 text-sm truncate">{s.title}</p>
              {s.subject && <p className="text-xs text-gray-400">{s.subject}</p>}
            </div>
          </GlassCard>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Bookmark size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nothing saved yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Settings ───────────────────────────────────────────────────────────────────
function SettingsTab() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [section, setSection] = useState<string | null>(null);

  const logout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate('/');
  };

  const settingGroups = [
    { id: 'profile', icon: User, label: 'Edit Profile', color: 'bg-blue-100 text-blue-600' },
    { id: 'password', icon: Lock, label: 'Change Password', color: 'bg-green-100 text-green-600' },
    { id: 'billing', icon: CreditCard, label: 'Billing & Subscription', color: 'bg-amber-100 text-amber-600' },
    { id: 'export', icon: Download, label: 'Export My Data', color: 'bg-teal-100 text-teal-600' },
    { id: 'delete', icon: Trash2, label: 'Delete Account', color: 'bg-red-100 text-red-600' },
  ];

  return (
    <div className="space-y-4">
      {/* Profile edit now lives on its own page */}

      {section === 'billing' && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">Billing</h3>
            <button onClick={() => setSection(null)} className="text-xs text-gray-400">Close</button>
          </div>
          <p className="text-sm text-gray-600 mb-3">Current plan: Free Trial</p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/subscribe')}
            className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl text-sm">Upgrade to Premium</motion.button>
        </GlassCard>
      )}

      <GlassCard className="divide-y divide-gray-100">
        {settingGroups.map(({ id, icon: Icon, label, color }) => (
          <motion.button key={id} whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (id === 'profile') navigate('/profile/edit');
              else if (id === 'billing') navigate('/subscribe');
              else setSection(section === id ? null : id);
            }}
            className="w-full flex items-center gap-3 p-4">
            <span className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}><Icon size={17} /></span>
            <span className={`flex-1 text-sm font-medium text-left ${id === 'delete' ? 'text-red-600' : 'text-gray-700'}`}>{label}</span>
            <ChevronRight size={16} className="text-gray-400" />
          </motion.button>
        ))}
      </GlassCard>

      <motion.button whileTap={{ scale: 0.97 }} onClick={logout} disabled={loggingOut}
        className="w-full bg-red-50 border border-red-200 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
        {loggingOut ? <div className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <><LogOut size={18} /><span>Sign Out / Log Out</span></>}
      </motion.button>
    </div>
  );
}
