import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft, Zap, Flame, Trophy, BookOpen, MapPin, School,
  Instagram, Facebook, Linkedin, Twitter, Youtube, Globe,
  GraduationCap, Calendar, Star, Target, TrendingUp, Award,
  ExternalLink, MessageCircle, Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import GlassCard from '../../components/GlassCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import BackButton from '../../components/BackButton';
import AdminBadge from '../../components/AdminBadge';

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
  'from-green-500 to-emerald-600',
];

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/profile/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setProfile(data);
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      <LoadingSpinner size="lg" text="Loading profile…" />
    </div>
  );

  if (error || !profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gradient-to-b from-slate-50 to-white">
      <div className="text-5xl mb-4">😕</div>
      <h2 className="font-black text-gray-800 text-xl mb-2">Profile not found</h2>
      <p className="text-gray-400 text-sm mb-6">{error || "This student hasn't set up their profile yet."}</p>
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(-1)}
        className="bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl">Go Back</motion.button>
    </div>
  );

  const avatarColor = profile.avatar_color || AVATAR_COLORS[0];
  const initial = profile.full_name?.[0]?.toUpperCase() || 'S';
  const joinYear = profile.created_at ? new Date(profile.created_at).getFullYear() : null;

  const socialLinks = [
    { icon: Instagram, label: 'Instagram', url: profile.instagram_url, color: 'text-pink-500', bg: 'bg-pink-50' },
    { icon: Facebook,  label: 'Facebook',  url: profile.facebook_url,  color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Linkedin,  label: 'LinkedIn',  url: profile.linkedin_url,  color: 'text-sky-700',  bg: 'bg-sky-50' },
    { icon: Twitter,   label: 'Twitter/X', url: profile.twitter_url,   color: 'text-gray-800', bg: 'bg-gray-100' },
    { icon: Youtube,   label: 'YouTube',   url: profile.youtube_url,   color: 'text-red-600',  bg: 'bg-red-50' },
    { icon: Globe,     label: 'Website',   url: profile.website_url,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ].filter(s => s.url);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-10">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <BackButton fallback="/community" />
        {isOwnProfile && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/profile/edit')}
            className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl">
            Edit Profile
          </motion.button>
        )}
      </div>

      {/* Hero card */}
      <div className="px-4 mb-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-gray-200/60 border border-gray-100">
          {/* Gradient banner */}
          <div className={`bg-gradient-to-r ${avatarColor} h-28 relative`}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
          </div>
          {/* Avatar */}
          <div className="px-5 pb-5">
            <div className="relative -mt-12 mb-4">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl" />
              ) : (
                <div className={`w-24 h-24 bg-gradient-to-br ${avatarColor} rounded-2xl flex items-center justify-center text-white text-4xl font-black border-4 border-white shadow-xl`}>
                  {initial}
                </div>
              )}
              {isOwnProfile && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow">
                  <span className="text-white text-xs">✏️</span>
                </div>
              )}
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-black text-gray-900 leading-tight">{profile.full_name}</h1>
                  <AdminBadge userId={userId} role={profile.role} size="md" />
                </div>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <GraduationCap size={11} /> Grade {profile.grade}
                  </span>
                  {profile.stream && (
                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">{profile.stream}</span>
                  )}
                  {joinYear && (
                    <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Calendar size={10} /> Since {joinYear}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-gray-600 text-sm leading-relaxed mt-3 italic">"{profile.bio}"</p>
            )}

            {/* Location & school */}
            <div className="flex flex-col gap-1.5 mt-3">
              {profile.school_name && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <School size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate">{profile.school_name}</span>
                </div>
              )}
              {profile.district && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                  <span>{profile.district}{profile.province ? `, ${profile.province}` : ''}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Zap,    value: (profile.xp_points || 0).toLocaleString(), label: 'XP Points',  color: 'bg-amber-50',  iconColor: 'text-amber-500' },
            { icon: Flame,  value: profile.streak_count || 0,                  label: 'Day Streak', color: 'bg-orange-50', iconColor: 'text-orange-500' },
            { icon: Trophy, value: '#—',                                        label: 'Rank',       color: 'bg-yellow-50', iconColor: 'text-yellow-500' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className={`${s.color} rounded-2xl p-4 text-center`}>
                <Icon size={20} className={`${s.iconColor} mx-auto mb-1.5`} fill="currentColor" />
                <p className="text-xl font-black text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Subjects */}
      {(profile.subjects || []).length > 0 && (
        <div className="px-4 mb-4">
          <GlassCard className="p-4">
            <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
              <BookOpen size={15} className="text-blue-500" /> Subjects
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.subjects.map((s: string) => (
                <span key={s} className="bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Social links */}
      {socialLinks.length > 0 && (
        <div className="px-4 mb-4">
          <GlassCard className="p-4">
            <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
              <Users size={15} className="text-indigo-500" /> Connect
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              {socialLinks.map(({ icon: Icon, label, url, color, bg }) => (
                <motion.a key={label} href={url!.startsWith('http') ? url! : `https://${url}`}
                  target="_blank" rel="noopener noreferrer"
                  whileTap={{ scale: 0.92 }}
                  className={`${bg} rounded-2xl p-3 flex flex-col items-center gap-1.5 border border-white/60`}>
                  <Icon size={20} className={color} />
                  <span className="text-xs font-semibold text-gray-600">{label}</span>
                  <ExternalLink size={10} className="text-gray-400" />
                </motion.a>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* CTA if viewing own profile */}
      {isOwnProfile && (
        <div className="px-4">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/profile/edit')}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
            ✏️ Edit Your Profile
          </motion.button>
        </div>
      )}

      {/* Message button if viewing others */}
      {!isOwnProfile && (
        <div className="px-4">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/community')}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
            <MessageCircle size={18} /> Message in Community
          </motion.button>
        </div>
      )}
    </div>
  );
}
