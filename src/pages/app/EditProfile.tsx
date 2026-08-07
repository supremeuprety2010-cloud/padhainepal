import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Check, X, Instagram, Facebook, Linkedin, Twitter,
  Youtube, Globe, MapPin, School, User, FileText, ChevronDown,
  Loader, AlertCircle, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import GlassCard from '../../components/GlassCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PROVINCES, DISTRICTS_BY_PROVINCE } from '../../lib/constants';

const AVATAR_COLORS = [
  { label: 'Ocean',   value: 'from-blue-500 to-indigo-600'   },
  { label: 'Forest',  value: 'from-emerald-500 to-teal-600'  },
  { label: 'Sunset',  value: 'from-rose-500 to-pink-600'     },
  { label: 'Royal',   value: 'from-purple-500 to-violet-600' },
  { label: 'Golden',  value: 'from-amber-500 to-orange-600'  },
  { label: 'Sky',     value: 'from-cyan-500 to-blue-600'     },
  { label: 'Orchid',  value: 'from-fuchsia-500 to-purple-600'},
  { label: 'Mint',    value: 'from-green-500 to-emerald-600' },
];

interface FormState {
  full_name: string;
  bio: string;
  school_name: string;
  district: string;
  province: string;
  avatar_color: string;
  instagram_url: string;
  facebook_url: string;
  linkedin_url: string;
  twitter_url: string;
  youtube_url: string;
  website_url: string;
}

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    full_name: '', bio: '', school_name: '', district: '', province: '',
    avatar_color: 'from-blue-500 to-indigo-600',
    instagram_url: '', facebook_url: '', linkedin_url: '',
    twitter_url: '', youtube_url: '', website_url: '',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>('basic');

  // Load existing profile
  useEffect(() => {
    if (!user) return;
    fetch(`/api/profile/${user.id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setForm({
            full_name:     data.full_name     || '',
            bio:           data.bio           || '',
            school_name:   data.school_name   || '',
            district:      data.district      || '',
            province:      data.province      || '',
            avatar_color:  data.avatar_color  || 'from-blue-500 to-indigo-600',
            instagram_url: data.instagram_url || '',
            facebook_url:  data.facebook_url  || '',
            linkedin_url:  data.linkedin_url  || '',
            twitter_url:   data.twitter_url   || '',
            youtube_url:   data.youtube_url   || '',
            website_url:   data.website_url   || '',
          });
          setAvatarUrl(data.avatar_url || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [user]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB'); return; }
    // Preview
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setAvatarPreview(reader.result as string);
      setUploadingAvatar(true);
      try {
        const res = await fetch('/api/profile/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, file_base64: base64, file_name: file.name, content_type: file.type }),
        });
        const data = await res.json();
        if (data.url) setAvatarUrl(data.url);
        else setError(data.error || 'Upload failed');
      } catch { setError('Upload failed. Try again.'); }
      finally { setUploadingAvatar(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      await refreshProfile();
      setSaved(true);
      setTimeout(() => { setSaved(false); navigate(`/user/${user.id}`); }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  if (loadingProfile) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      <LoadingSpinner size="lg" text="Loading your profile…" />
    </div>
  );

  const initial = form.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'S';

  const sections = [
    { id: 'basic',    label: '👤 Basic Info',      icon: User      },
    { id: 'location', label: '📍 Location',         icon: MapPin    },
    { id: 'avatar',   label: '🎨 Avatar',           icon: Camera    },
    { id: 'social',   label: '🔗 Social Links',     icon: Globe     },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-32">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-14">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <ChevronLeft size={18} />
          </motion.button>
          <h1 className="font-black text-gray-900">Edit Profile</h1>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave} disabled={saving}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'} disabled:opacity-50`}>
            {saving ? <Loader size={14} className="animate-spin" /> : saved ? <><Check size={14} className="inline mr-1" />Saved!</> : 'Save'}
          </motion.button>
        </div>
      </div>

      {/* Avatar preview hero */}
      <div className="px-4 pt-5 pb-4">
        <div className={`bg-gradient-to-r ${form.avatar_color} rounded-3xl p-6 flex items-center gap-5 relative overflow-hidden`}>
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-xl" />
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-3 border-white shadow-xl" style={{ borderWidth: 3 }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-white/20 flex items-center justify-center text-white text-3xl font-black`}>
                  {initial}
                </div>
              )}
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
              {uploadingAvatar ? <Loader size={14} className="animate-spin text-blue-600" /> : <Camera size={14} className="text-gray-700" />}
            </motion.button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="relative">
            <p className="text-white font-black text-lg leading-tight">{form.full_name || 'Your Name'}</p>
            <p className="text-white/70 text-sm mt-0.5">Grade {profile?.grade}{profile?.stream ? ` · ${profile.stream}` : ''}</p>
            {form.bio && <p className="text-white/60 text-xs mt-1 italic line-clamp-2">"{form.bio}"</p>}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => setError('')} className="ml-auto"><X size={14} className="text-red-400" /></button>
        </div>
      )}

      {/* Accordion sections */}
      <div className="px-4 space-y-3">

        {/* Basic Info */}
        <AccordionSection id="basic" label="👤 Basic Info" active={activeSection} onToggle={setActiveSection}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Display Name</label>
              <input value={form.full_name} onChange={set('full_name')} placeholder="Your full name" maxLength={60}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Bio</label>
              <textarea value={form.bio} onChange={set('bio')} placeholder="Tell other students about yourself… your study goals, hobbies, favourite subjects." rows={3} maxLength={200}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-colors resize-none" />
              <p className="text-xs text-gray-400 text-right mt-1">{form.bio.length}/200</p>
            </div>
            {/* Read-only fields */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5">
              <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                <AlertCircle size={12} /> These cannot be changed after onboarding
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="bg-white border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                  📚 Grade {profile?.grade}
                </span>
                {profile?.stream && (
                  <span className="bg-white border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                    🎓 {profile.stream}
                  </span>
                )}
                {(profile?.subjects || []).slice(0, 3).map((s: string) => (
                  <span key={s} className="bg-white border border-amber-200 text-amber-800 text-xs px-2.5 py-1.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Location */}
        <AccordionSection id="location" label="📍 Location & School" active={activeSection} onToggle={setActiveSection}>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">School Name</label>
              <div className="relative">
                <School size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={form.school_name} onChange={set('school_name')} placeholder="Your school name" maxLength={100}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Province</label>
              <select value={form.province} onChange={e => { set('province')(e); setForm(f => ({ ...f, province: e.target.value, district: '' })); }}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 appearance-none">
                <option value="">Select province…</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {form.province && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">District</label>
                <select value={form.district} onChange={set('district')}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 appearance-none">
                  <option value="">Select district…</option>
                  {(DISTRICTS_BY_PROVINCE[form.province] || []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
          </div>
        </AccordionSection>

        {/* Avatar colour */}
        <AccordionSection id="avatar" label="🎨 Avatar Style" active={activeSection} onToggle={setActiveSection}>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-3">Profile photo</p>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-5 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all">
                {uploadingAvatar ? (
                  <><Loader size={24} className="animate-spin text-blue-500" /><p className="text-sm text-blue-600 font-medium">Uploading…</p></>
                ) : (avatarUrl || avatarPreview) ? (
                  <><img src={avatarPreview || avatarUrl!} alt="avatar" className="w-16 h-16 rounded-2xl object-cover" /><p className="text-sm text-blue-600 font-medium">Tap to change photo</p></>
                ) : (
                  <><Camera size={24} className="text-gray-400" /><p className="text-sm text-gray-500">Upload profile photo</p><p className="text-xs text-gray-400">JPG, PNG or WebP · Max 5 MB</p></>
                )}
              </motion.button>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-3">Background colour (shown when no photo)</p>
              <div className="grid grid-cols-4 gap-2.5">
                {AVATAR_COLORS.map(c => (
                  <motion.button key={c.value} whileTap={{ scale: 0.88 }} onClick={() => setForm(f => ({ ...f, avatar_color: c.value }))}
                    className={`relative h-14 bg-gradient-to-br ${c.value} rounded-2xl flex items-center justify-center transition-all ${form.avatar_color === c.value ? 'outline outline-3 outline-offset-2 outline-blue-500 scale-105' : 'opacity-70 hover:opacity-100'}`}>
                    {form.avatar_color === c.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow">
                          <Check size={12} className="text-blue-600" />
                        </div>
                      </div>
                    )}
                    <span className="text-white text-xs font-semibold drop-shadow">{c.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Social */}
        <AccordionSection id="social" label="🔗 Social Links" active={activeSection} onToggle={setActiveSection}>
          <div className="space-y-3">
            {[
              { key: 'instagram_url', icon: Instagram, label: 'Instagram', placeholder: 'instagram.com/username', color: 'text-pink-500' },
              { key: 'facebook_url',  icon: Facebook,  label: 'Facebook',  placeholder: 'facebook.com/username',  color: 'text-blue-600' },
              { key: 'linkedin_url',  icon: Linkedin,  label: 'LinkedIn',  placeholder: 'linkedin.com/in/username',color: 'text-sky-700' },
              { key: 'twitter_url',   icon: Twitter,   label: 'Twitter/X', placeholder: 'twitter.com/username',   color: 'text-gray-800' },
              { key: 'youtube_url',   icon: Youtube,   label: 'YouTube',   placeholder: 'youtube.com/@channel',   color: 'text-red-600' },
              { key: 'website_url',   icon: Globe,     label: 'Website',   placeholder: 'yourwebsite.com',        color: 'text-emerald-600' },
            ].map(({ key, icon: Icon, label, placeholder, color }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{label}</label>
                <div className="relative">
                  <Icon size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${color}`} />
                  <input
                    value={form[key as keyof FormState]}
                    onChange={set(key as keyof FormState)}
                    placeholder={placeholder}
                    maxLength={200}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                  />
                  {form[key as keyof FormState] && (
                    <button onClick={() => setForm(f => ({ ...f, [key]: '' }))} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X size={14} className="text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
              💡 You can enter just the username (e.g. <strong>@aarav123</strong>) or the full URL. Links are only visible to other PadhaiNepal students.
            </p>
          </div>
        </AccordionSection>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-20 left-0 right-0 px-4 z-30">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-3xl p-3 shadow-2xl shadow-black/10">
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving || saved}
            className={`w-full font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all ${
              saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white shadow-lg shadow-blue-200'
            } disabled:opacity-60`}>
            {saving ? <><Loader size={18} className="animate-spin" /> Saving…</> :
             saved  ? <><Check size={18} /> Profile Saved!</> :
                      '💾 Save Profile'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Accordion Section ────────────────────────────────────────────────────────
function AccordionSection({ id, label, active, onToggle, children }: {
  id: string; label: string; active: string | null;
  onToggle: (id: string | null) => void; children: React.ReactNode;
}) {
  const isOpen = active === id;
  return (
    <GlassCard className="overflow-hidden">
      <motion.button whileTap={{ scale: 0.99 }} onClick={() => onToggle(isOpen ? null : id)}
        className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="font-bold text-gray-800 text-sm">{label}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-gray-400" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-5 pb-5 border-t border-gray-100 pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
