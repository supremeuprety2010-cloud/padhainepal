import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Edit3, Trophy, Flame, Zap, Calendar, School, MapPin, BookOpen, Crown, ChevronRight, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';
import GlassCard from '../components/GlassCard';
import { SUBSCRIPTION_PRICES } from '../lib/constants';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate('/login');
  };

  const trialDaysLeft = () => {
    if (!profile?.trial_start) return 3;
    const start = new Date(profile.trial_start);
    const diff = Math.ceil(3 - (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-NP', { month: 'long', year: 'numeric' }) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 pt-12 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl">
              {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'S'}
            </div>
            <div>
              <h1 className="text-white text-xl font-black">{profile?.full_name || 'Student'}</h1>
              <p className="text-blue-200 text-sm">{user?.email || user?.phone}</p>
              <p className="text-blue-300 text-xs mt-0.5">Joined {joinDate}</p>
            </div>
          </div>
          <button onClick={() => navigate('/edit-profile')} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Edit3 size={16} className="text-white" />
          </button>
        </div>
      </div>

      <div className="px-5 -mt-12 space-y-4">
        {/* Stats */}
        <GlassCard className="p-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap size={16} className="text-amber-500" />
              </div>
              <p className="text-xl font-black text-gray-800">{(profile?.xp_points || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-400">XP Points</p>
            </div>
            <div className="text-center border-x border-gray-100">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame size={16} className="text-orange-500" />
              </div>
              <p className="text-xl font-black text-gray-800">{profile?.streak_count || 0}</p>
              <p className="text-xs text-gray-400">Day Streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy size={16} className="text-yellow-500" />
              </div>
              <p className="text-xl font-black text-gray-800">#--</p>
              <p className="text-xs text-gray-400">Rank</p>
            </div>
          </div>
        </GlassCard>

        {/* Subscription */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center">
              <Crown size={18} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800">Subscription</h3>
              <p className="text-xs text-gray-400">
                {trialDaysLeft() > 0 ? `Free trial · ${trialDaysLeft()} days left` : 'Free trial ended'}
              </p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/subscribe')} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-2xl text-sm shadow-lg shadow-amber-200">
            {trialDaysLeft() > 0 ? `Upgrade · NPR ${SUBSCRIPTION_PRICES[profile?.grade || 10]}/year` : 'Subscribe Now'}
          </motion.button>
        </GlassCard>

        {/* Profile Info */}
        <GlassCard className="p-4 space-y-3">
          <h3 className="font-bold text-gray-800">Academic Info</h3>
          {[
            { icon: BookOpen, label: 'Grade', value: `Grade ${profile?.grade}${profile?.stream ? ` · ${profile.stream}` : ''}` },
            { icon: School, label: 'School', value: profile?.school_name || 'Not set' },
            { icon: MapPin, label: 'Location', value: profile?.district ? `${profile.district}, ${profile.province}` : 'Not set' },
            { icon: Calendar, label: 'Subjects', value: (profile?.subjects || []).join(', ') || 'None selected' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={14} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
              </div>
            </div>
          ))}
        </GlassCard>

        {/* Quick Links */}
        <GlassCard className="divide-y divide-gray-100">
          {[
            { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
            { label: 'My Progress', icon: Zap, path: '/progress' },
          ].map(({ label, icon: Icon, path }) => (
            <motion.button key={label} whileTap={{ scale: 0.98 }} onClick={() => navigate(path)} className="w-full flex items-center gap-3 p-4">
              <Icon size={18} className="text-gray-500" />
              <span className="flex-1 text-sm font-medium text-gray-700 text-left">{label}</span>
              <ChevronRight size={16} className="text-gray-400" />
            </motion.button>
          ))}
        </GlassCard>

        {/* Logout */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogout} disabled={loggingOut} className="w-full bg-red-50 border border-red-200 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
          {loggingOut ? <div className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <><LogOut size={18} /><span>Sign Out</span></>}
        </motion.button>
      </div>
    </div>
  );
}
