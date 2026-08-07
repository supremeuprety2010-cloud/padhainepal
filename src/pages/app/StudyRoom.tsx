import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Send, Clock, Users, Check, ChevronLeft, Play, Pause,
  CheckSquare, Lock, Globe, Eye, EyeOff, X, Crown, Zap, Flame,
  Timer, AlertCircle, Vote, UserCheck, Shield, Settings,
  BookOpen, Copy, Share2, MoreVertical, Wifi, WifiOff, Bell,
  ChevronRight, Star, TrendingUp, Target
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import supabase from '../../lib/supabase';
import AppHeader from '../../components/AppHeader';
import GlassCard from '../../components/GlassCard';
import LoadingSpinner from '../../components/LoadingSpinner';

// ─────────────────────────────────────────────────────────────────────────────
// ROOM LIST
// ─────────────────────────────────────────────────────────────────────────────
export function StudyRoomList() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  // Create form state
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [maxMembers, setMaxMembers] = useState(20);
  const [creating, setCreating] = useState(false);
  // Join private room
  const [joinRoomId, setJoinRoomId] = useState<number | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  const fetchRooms = useCallback(async () => {
    const data = await fetch('/api/study-rooms?type=public').then(r => r.json()).catch(() => []);
    setRooms(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const createRoom = async () => {
    if (!name.trim() || !user) return;
    setCreating(true);
    try {
      const res = await fetch('/api/study-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), subject, description, created_by: user.id,
          creator_name: profile?.full_name || 'Student',
          is_public: isPublic,
          password: isPublic ? null : password,
          duration_minutes: durationMinutes || null,
          max_members: maxMembers,
        }),
      });
      if (res.ok) {
        const room = await res.json();
        navigate(`/study-room/${room.id}`);
      }
    } finally { setCreating(false); }
  };

  const handleJoinPrivate = async (room: any) => {
    if (!user) return;
    setJoining(true); setJoinError('');
    try {
      const res = await fetch(`/api/study-rooms/${room.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, user_name: profile?.full_name, password: joinPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setJoinError(data.error || 'Failed to join'); return; }
      navigate(`/study-room/${room.id}`);
    } finally { setJoining(false); }
  };

  const timeLeft = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m left`;
    return `${Math.floor(m / 60)}h ${m % 60}m left`;
  };

  const DURATION_OPTIONS = [
    { label: '30 min', value: 30 }, { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 }, { label: '3 hours', value: 180 }, { label: 'No limit', value: '' as any },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-slate-50 to-white pb-24">
      <AppHeader title="Study Rooms" back />
      <div className="pt-16 px-4 space-y-4">

        {/* Hero */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-5 relative overflow-hidden mt-2">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <h2 className="text-white text-xl font-black mb-1">Study Together 📚</h2>
            <p className="text-indigo-200 text-sm leading-relaxed">Join a room, focus together, and motivate each other to study harder.</p>
            <div className="flex items-center gap-3 mt-3">
              <div className="bg-white/20 rounded-xl px-3 py-1.5 text-center">
                <p className="text-white font-black text-sm">{rooms.length}</p>
                <p className="text-indigo-200 text-xs">Live rooms</p>
              </div>
              <div className="bg-white/20 rounded-xl px-3 py-1.5 text-center">
                <p className="text-white font-black text-sm">{rooms.reduce((s, r) => s + (r.member_count || 0), 0)}</p>
                <p className="text-indigo-200 text-xs">Studying now</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create button */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(s => !s)}
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
          <Plus size={20} /> Create a Study Room
        </motion.button>

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <GlassCard className="p-5 space-y-4 border border-indigo-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-gray-900">New Study Room</h3>
                  <button onClick={() => setShowCreate(false)} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                    <X size={14} className="text-gray-500" />
                  </button>
                </div>

                <input value={name} onChange={e => setName(e.target.value)} placeholder="Room name (e.g. Physics Study Group)" maxLength={50}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400" />

                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description (optional)" maxLength={100}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400" />

                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none appearance-none">
                  <option value="">No subject tag</option>
                  {(profile?.subjects || []).map((s: string) => <option key={s} value={s}>{s}</option>)}
                </select>

                {/* Public / Private toggle */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Visibility</p>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsPublic(true)}
                      className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all ${isPublic ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                      <Globe size={16} className={isPublic ? 'text-indigo-600' : 'text-gray-400'} />
                      <div className="text-left">
                        <p className={`text-xs font-bold ${isPublic ? 'text-indigo-700' : 'text-gray-600'}`}>Public</p>
                        <p className="text-xs text-gray-400">Anyone can join</p>
                      </div>
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsPublic(false)}
                      className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all ${!isPublic ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                      <Lock size={16} className={!isPublic ? 'text-indigo-600' : 'text-gray-400'} />
                      <div className="text-left">
                        <p className={`text-xs font-bold ${!isPublic ? 'text-indigo-700' : 'text-gray-600'}`}>Private</p>
                        <p className="text-xs text-gray-400">Password required</p>
                      </div>
                    </motion.button>
                  </div>
                </div>

                {/* Password field for private rooms */}
                <AnimatePresence>
                  {!isPublic && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'}
                          placeholder="Set a room password" className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-9 pr-10 py-3 text-sm focus:outline-none focus:border-indigo-400" />
                        <button onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Duration */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Room Duration</p>
                  <div className="flex gap-2 flex-wrap">
                    {DURATION_OPTIONS.map(opt => (
                      <button key={String(opt.value)} onClick={() => setDurationMinutes(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${durationMinutes === opt.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max members */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Max Members: {maxMembers}</p>
                  <input type="range" min={2} max={50} value={maxMembers} onChange={e => setMaxMembers(parseInt(e.target.value))}
                    className="w-full accent-indigo-600" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1"><span>2</span><span>50</span></div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowCreate(false)} className="flex-1 bg-gray-100 text-gray-600 font-medium py-3 rounded-2xl text-sm">Cancel</button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={createRoom} disabled={creating || !name.trim()}
                    className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-2xl text-sm shadow-lg shadow-indigo-200 disabled:opacity-40">
                    {creating ? <LoadingSpinner size="sm" /> : '🚀 Create Room'}
                  </motion.button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Room list */}
        {loading ? <LoadingSpinner size="lg" text="Finding rooms..." /> : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Live Rooms ({rooms.length})</p>
            {rooms.map((room: any) => {
              const left = timeLeft(room.settings?.expires_at);
              const isFull = room.member_count >= (room.settings?.max_members || 20);
              return (
                <motion.div key={room.id} whileTap={{ scale: 0.98 }}
                  onClick={() => room.is_public ? navigate(`/study-room/${room.id}`) : setJoinRoomId(room.id)}
                  className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${room.is_public ? 'bg-indigo-100' : 'bg-amber-100'}`}>
                      {room.is_public ? <Globe size={20} className="text-indigo-600" /> : <Lock size={20} className="text-amber-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm">{room.name}</p>
                        {!room.is_public && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">🔒 Private</span>}
                        {isFull && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">Full</span>}
                      </div>
                      {room.settings?.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{room.settings.description}</p>}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-gray-500"><Users size={11} />{room.member_count}/{room.settings?.max_members || 20}</span>
                        {room.subject && <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{room.subject}</span>}
                        {left && <span className={`text-xs font-semibold flex items-center gap-1 ${left === 'Expired' ? 'text-red-500' : 'text-emerald-600'}`}><Clock size={10} />{left}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-gray-400">{room.creator_name?.split(' ')[0]}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {rooms.length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📚</div>
                <p className="font-semibold text-gray-600 mb-1">No active rooms</p>
                <p className="text-gray-400 text-sm">Create one and invite your friends!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Private room password modal */}
      <AnimatePresence>
        {joinRoomId !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => { setJoinRoomId(null); setJoinPassword(''); setJoinError(''); }} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 px-6">
              <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                <div className="text-center mb-5">
                  <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Lock size={24} className="text-amber-600" />
                  </div>
                  <h3 className="font-black text-gray-900">Private Room</h3>
                  <p className="text-gray-500 text-sm mt-1">Enter the password to join</p>
                </div>
                <div className="relative mb-3">
                  <input value={joinPassword} onChange={e => setJoinPassword(e.target.value)} type="password"
                    placeholder="Room password" onKeyDown={e => e.key === 'Enter' && handleJoinPrivate(rooms.find(r => r.id === joinRoomId))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
                {joinError && <p className="text-red-500 text-xs mb-3 text-center">{joinError}</p>}
                <div className="flex gap-2">
                  <button onClick={() => { setJoinRoomId(null); setJoinPassword(''); setJoinError(''); }} className="flex-1 bg-gray-100 text-gray-600 font-medium py-3 rounded-2xl text-sm">Cancel</button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleJoinPrivate(rooms.find(r => r.id === joinRoomId))} disabled={joining || !joinPassword}
                    className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-2xl text-sm disabled:opacity-40">
                    {joining ? '...' : 'Join Room'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOM DETAIL
// ─────────────────────────────────────────────────────────────────────────────
export default function StudyRoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [room, setRoom] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [checklistInput, setChecklistInput] = useState('');
  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'checklist' | 'members'>('chat');
  const [activeVote, setActiveVote] = useState<any>(null);
  const [voteCountdown, setVoteCountdown] = useState(0);
  const [showMemberProfile, setShowMemberProfile] = useState<any>(null);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [roomTimeLeft, setRoomTimeLeft] = useState<number | null>(null);
  const [focusTimeLeft, setFocusTimeLeft] = useState<number | null>(null);
  const [_joined] = useState(false); // kept for ref, not used
  const [roomClosed, setRoomClosed] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const roomTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAdmin = room?.created_by === user?.id;

  // ── Load room ──────────────────────────────────────────────────────────────
  const loadRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      const [roomRes, membersRes, messagesRes, voteRes] = await Promise.allSettled([
        fetch(`/api/study-rooms/${roomId}`).then(r => r.json()),
        fetch(`/api/study-rooms/${roomId}/members`).then(r => r.json()),
        fetch(`/api/study-rooms/${roomId}/messages`).then(r => r.json()),
        fetch(`/api/study-rooms/${roomId}/vote`).then(r => r.json()),
      ]);
      if (roomRes.status === 'fulfilled') {
        const r = roomRes.value;
        setRoom(r); setChecklist(r.checklist || []);
        setSettings(r.settings);
        if (r.settings?.status === 'closed') setRoomClosed(true);
      }
      if (membersRes.status === 'fulfilled') setMembers(Array.isArray(membersRes.value) ? membersRes.value : []);
      if (messagesRes.status === 'fulfilled') setMessages(Array.isArray(messagesRes.value) ? messagesRes.value : []);
      if (voteRes.status === 'fulfilled' && voteRes.value) setActiveVote(voteRes.value);
    } catch (e) { console.error(e); }
  }, [roomId]);

  // ── Join room on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !roomId) return;
    fetch(`/api/study-rooms/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id, user_name: profile?.full_name || 'Student',
        user_grade: profile?.grade, user_school: profile?.school_name,
        user_district: profile?.district, xp_points: profile?.xp_points,
        streak_count: profile?.streak_count,
      }),
    }).then(r => r.json()).then(data => {
      // Only hard-block on fatal errors (room closed/expired/wrong password)
      if (data.error === 'Room is closed' || data.error === 'Room has expired') {
        setRoomClosed(true);
      } else if (data.error === 'Incorrect password') {
        alert('Incorrect room password');
        navigate('/study-room');
      } else {
        // success or soft error (full, etc.) — still load the room
        loadRoom();
      }
    }).catch(() => loadRoom()); // network error — still try to load
  }, [user?.id, roomId]);

  // ── Leave room on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (user && roomId) {
        fetch(`/api/study-rooms/${roomId}/join`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, user_name: profile?.full_name }),
        }).catch(() => {});
      }
    };
  }, [user, roomId]);

  // ── Realtime subscriptions ─────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    const channel = supabase.channel(`room-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` },
        (payload) => setMessages(prev => [...prev, payload.new]))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
        () => fetch(`/api/study-rooms/${roomId}/members`).then(r => r.json()).then(d => setMembers(Array.isArray(d) ? d : [])))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
        () => fetch(`/api/study-rooms/${roomId}/members`).then(r => r.json()).then(d => setMembers(Array.isArray(d) ? d : [])))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'room_settings', filter: `room_id=eq.${roomId}` },
        (payload) => { setSettings(payload.new); if (payload.new.status === 'closed') setRoomClosed(true); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_votes', filter: `room_id=eq.${roomId}` },
        (payload) => setActiveVote(payload.new))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'room_votes', filter: `room_id=eq.${roomId}` },
        (payload) => setActiveVote(payload.new))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  // ── Room expiry timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (roomTimerRef.current) clearInterval(roomTimerRef.current);
    if (!settings?.expires_at) { setRoomTimeLeft(null); return; }
    const update = () => {
      const diff = Math.floor((new Date(settings.expires_at).getTime() - Date.now()) / 1000);
      if (diff <= 0) { setRoomTimeLeft(0); clearInterval(roomTimerRef.current!); }
      else setRoomTimeLeft(diff);
    };
    update();
    roomTimerRef.current = setInterval(update, 1000);
    return () => { if (roomTimerRef.current) clearInterval(roomTimerRef.current); };
  }, [settings?.expires_at]);

  // ── Focus timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (focusTimerRef.current) clearInterval(focusTimerRef.current);
    if (!settings?.room_timer_end || !settings?.room_timer_running) { setFocusTimeLeft(null); return; }
    const update = () => {
      const diff = Math.floor((new Date(settings.room_timer_end).getTime() - Date.now()) / 1000);
      if (diff <= 0) { setFocusTimeLeft(0); clearInterval(focusTimerRef.current!); }
      else setFocusTimeLeft(diff);
    };
    update();
    focusTimerRef.current = setInterval(update, 1000);
    return () => { if (focusTimerRef.current) clearInterval(focusTimerRef.current); };
  }, [settings?.room_timer_end, settings?.room_timer_running]);

  // ── Vote countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeVote?.expires_at || activeVote?.status !== 'active') return;
    const interval = setInterval(() => {
      const diff = Math.floor((new Date(activeVote.expires_at).getTime() - Date.now()) / 1000);
      setVoteCountdown(Math.max(0, diff));
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeVote?.expires_at, activeVote?.status]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fmt = (s: number) => {
    if (s >= 3600) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const sendMessage = async (content?: string) => {
    const text = content || msgInput.trim();
    if (!text || !user || !roomId) return;
    setSending(true);
    await fetch(`/api/study-rooms/${roomId}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, user_name: profile?.full_name || 'Student', content: text }),
    }).catch(() => {});
    setMsgInput('');
    setSending(false);
  };

  const updateChecklist = async (updated: any[]) => {
    setChecklist(updated);
    await fetch(`/api/study-rooms/${roomId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklist: updated }),
    }).catch(() => {});
  };

  const addChecklistItem = () => {
    if (!checklistInput.trim()) return;
    const updated = [...checklist, { text: checklistInput.trim(), done: false }];
    setChecklistInput('');
    updateChecklist(updated);
  };

  const toggleChecklist = (i: number) => updateChecklist(checklist.map((item, idx) => idx === i ? { ...item, done: !item.done } : item));

  const timerAction = async (action: string, mins?: number) => {
    await fetch(`/api/study-rooms/${roomId}/timer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, minutes: mins || timerMinutes, user_id: user?.id }),
    }).then(r => r.json()).then(data => { if (data.ok) setSettings((s: any) => ({ ...s, ...data })); }).catch(() => {});
    setShowTimerModal(false);
  };

  const castVote = async (vote: 'yes' | 'no') => {
    await fetch(`/api/study-rooms/${roomId}/vote`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cast', user_id: user?.id, vote }),
    }).catch(() => {});
  };

  const initiateVote = async () => {
    await fetch(`/api/study-rooms/${roomId}/vote`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'initiate', user_id: user?.id, user_name: profile?.full_name }),
    }).catch(() => {});
  };

  // ── Room closed screen ─────────────────────────────────────────────────────
  if (roomClosed) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-6 text-center">
      <div className="text-6xl mb-5">🏁</div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Room Ended</h2>
      <p className="text-gray-500 text-sm mb-8">Great study session! Keep the momentum going.</p>
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/study-room')}
        className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-indigo-200">
        Find Another Room
      </motion.button>
    </div>
  );

  if (!room) return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner size="lg" text="Joining room…" /></div>;

  const focusPct = settings?.room_timer_end && focusTimeLeft != null
    ? Math.round((1 - focusTimeLeft / ((settings.duration_minutes || 25) * 60)) * 100)
    : 0;

  const myVoteYes = activeVote?.status === 'active' && (activeVote.yes_votes || []).includes(user?.id);
  const myVoteNo = activeVote?.status === 'active' && (activeVote.no_votes || []).includes(user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col pb-0">
      {/* ── Sticky header ── */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/study-room')} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-black text-gray-900 text-sm truncate">{room.name}</p>
              {!room.is_public && <Lock size={12} className="text-amber-500 flex-shrink-0" />}
              {isAdmin && <Crown size={12} className="text-amber-500 flex-shrink-0" />}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <p className="text-xs text-gray-400">{members.length} studying · {room.subject || 'General'}</p>
            </div>
          </div>

          {/* Room timer display */}
          {roomTimeLeft !== null && (
            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold ${roomTimeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
              <Clock size={12} /> {fmt(roomTimeLeft)}
            </div>
          )}

          {/* Admin controls */}
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowTimerModal(true)}
                className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Timer size={16} className="text-indigo-600" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={initiateVote}
                className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle size={16} className="text-red-500" />
              </motion.button>
            </div>
          )}
        </div>

        {/* Focus timer bar */}
        {focusTimeLeft !== null && focusTimeLeft > 0 && (
          <div className="px-4 pb-2">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 flex items-center gap-3">
              <div className="relative w-8 h-8 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#e0e7ff" strokeWidth="4" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#4f46e5" strokeWidth="4"
                    strokeDasharray={`${focusPct} ${100 - focusPct}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black text-indigo-700">{Math.floor(focusTimeLeft / 60)}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-indigo-700">Focus Timer</p>
                <p className="text-xs text-indigo-500">{fmt(focusTimeLeft)} remaining</p>
              </div>
              {isAdmin && (
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => timerAction('extend', 10)}
                  className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg">+10m</motion.button>
              )}
            </div>
          </div>
        )}

        {/* Vote banner */}
        <AnimatePresence>
          {activeVote?.status === 'active' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-3 overflow-hidden">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-red-700 flex items-center gap-1.5">
                    🗳️ Vote to end room
                  </p>
                  <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">{voteCountdown}s</span>
                </div>
                <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
                  <span>✅ Yes: {(activeVote.yes_votes || []).length}</span>
                  <span>❌ No: {(activeVote.no_votes || []).length}</span>
                  <span>Need: {Math.ceil(activeVote.total_members / 2)}</span>
                </div>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => castVote('yes')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${myVoteYes ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'}`}>
                    ✅ End Room
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => castVote('no')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${myVoteNo ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'}`}>
                    ❌ Keep Going
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab bar */}
        <div className="flex px-4 pb-0 gap-1">
          {[['chat','💬','Chat'],['checklist','✅','Checklist'],['members','👥',`Members (${members.length})`]].map(([id, emoji, label]) => (
            <button key={id} onClick={() => setActiveTab(id as any)}
              className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 ${activeTab === id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Chat tab */}
        {activeTab === 'chat' && (
          <div className="px-4 py-4 space-y-2 pb-28">
            {messages.map((m: any, i: number) => {
              const isMe = m.user_id === user?.id;
              const isSystem = m.user_id === 'system';
              const isVoteMsg = m.msg_type === 'vote';
              if (isSystem) return (
                <div key={m.id || i} className="flex justify-center my-2">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${isVoteMsg ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                    {m.content}
                  </span>
                </div>
              );
              return (
                <motion.div key={m.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                  {!isMe && (
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-auto">
                      {m.user_name?.[0]?.toUpperCase() || 'S'}
                    </div>
                  )}
                  <div className={`max-w-[72%]`}>
                    {!isMe && <p className="text-xs text-gray-400 mb-0.5 ml-1">{m.user_name}</p>}
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                      {m.content}
                    </div>
                    <p className={`text-xs text-gray-300 mt-0.5 ${isMe ? 'text-right' : 'ml-1'}`}>
                      {new Date(m.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">👋</div>
                <p className="text-gray-400 text-sm">Say hello to start the conversation!</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Checklist tab */}
        {activeTab === 'checklist' && (
          <div className="px-4 py-4 space-y-3 pb-28">
            <div className="flex gap-2">
              <input value={checklistInput} onChange={e => setChecklistInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addChecklistItem()}
                placeholder="Add a study task…" className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 shadow-sm" />
              <motion.button whileTap={{ scale: 0.9 }} onClick={addChecklistItem} disabled={!checklistInput.trim()}
                className="bg-indigo-600 text-white px-4 rounded-2xl text-sm font-bold disabled:opacity-40 shadow-lg shadow-indigo-200">Add</motion.button>
            </div>
            <div className="space-y-2">
              {checklist.map((item, i) => (
                <motion.div key={i} layout whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${item.done ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 shadow-sm'}`}
                  onClick={() => toggleChecklist(i)}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.done ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                    {item.done && <Check size={12} className="text-white" />}
                  </div>
                  <span className={`text-sm flex-1 ${item.done ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>{item.text}</span>
                </motion.div>
              ))}
              {checklist.length === 0 && (
                <div className="text-center py-10">
                  <CheckSquare size={28} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Add tasks for your study session</p>
                </div>
              )}
            </div>
            {checklist.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-3 text-center">
                <p className="text-sm font-bold text-gray-600">{checklist.filter(i => i.done).length}/{checklist.length} tasks completed</p>
                <div className="h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${checklist.length > 0 ? (checklist.filter(i => i.done).length / checklist.length) * 100 : 0}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Members tab */}
        {activeTab === 'members' && (
          <div className="px-4 py-4 space-y-3 pb-28">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{members.length} members online</p>
            {members.map((m: any) => {
              const isCreator = m.user_id === room.created_by;
              const isMe = m.user_id === user?.id;
              return (
                <motion.div key={m.id} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/user/${m.user_id}`)}
                  className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm cursor-pointer hover:border-indigo-200 transition-all">
                  <div className="relative">
                    <div className="w-11 h-11 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-black text-base flex-shrink-0">
                      {m.user_name?.[0]?.toUpperCase() || 'S'}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-gray-800 text-sm">{m.user_name} {isMe && '(You)'}</p>
                      {isCreator && <Crown size={12} className="text-amber-500" />}
                    </div>
                    <p className="text-xs text-gray-400">
                      {m.user_grade ? `Grade ${m.user_grade}` : ''}{m.user_school ? ` · ${m.user_school}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    {m.xp_points > 0 && <p className="text-xs font-bold text-amber-600 flex items-center gap-0.5 justify-end"><Zap size={10} fill="currentColor" />{m.xp_points?.toLocaleString()}</p>}
                    {m.streak_count > 0 && <p className="text-xs text-orange-500 flex items-center gap-0.5 justify-end"><Flame size={10} fill="currentColor" />{m.streak_count}d</p>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Chat input (only in chat tab) ── */}
      {activeTab === 'chat' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-4 py-3">
          {/* Quick reactions */}
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
            {['👍', '🔥', '💡', '✅', '❓', '🎉'].map(emoji => (
              <motion.button key={emoji} whileTap={{ scale: 0.8 }} onClick={() => sendMessage(emoji)}
                className="text-xl w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                {emoji}
              </motion.button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
              placeholder="Type a message…" className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none" />
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendMessage()} disabled={!msgInput.trim() || sending}
              className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 disabled:opacity-40">
              <Send size={16} className="text-white" />
            </motion.button>
          </div>
        </div>
      )}

      {/* ── Timer modal (admin only) ── */}
      <AnimatePresence>
        {showTimerModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowTimerModal(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl pb-8">
              <div className="flex justify-center pt-3 pb-4"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
              <div className="px-5">
                <h3 className="font-black text-gray-900 text-lg mb-1 flex items-center gap-2"><Timer size={20} className="text-indigo-600" /> Timer Controls</h3>
                <p className="text-gray-400 text-sm mb-5">Only you (admin) can control the timers</p>

                {/* Focus timer */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 mb-3">Focus Timer (minutes)</p>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {[10, 15, 25, 30, 45, 60].map(m => (
                      <button key={m} onClick={() => setTimerMinutes(m)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${timerMinutes === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                        {m}m
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => timerAction('start')} className="bg-green-100 text-green-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1"><Play size={13} />Start</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => timerAction('extend')} className="bg-blue-100 text-blue-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1"><Plus size={13} />+{timerMinutes}m</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => timerAction('stop')} className="bg-red-100 text-red-600 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1"><Pause size={13} />Stop</motion.button>
                  </div>
                </div>

                {/* Room expiry extension */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500 mb-3">Extend Room Time</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[15, 30, 60].map(m => (
                      <motion.button key={m} whileTap={{ scale: 0.95 }} onClick={() => timerAction('extend_room', m)}
                        className="bg-emerald-100 text-emerald-700 font-bold py-2.5 rounded-xl text-xs">+{m}m</motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Member profile modal ── */}
      <AnimatePresence>
        {showMemberProfile && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowMemberProfile(null)} />
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 px-6">
              <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl">
                <div className="text-center mb-5">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-3 shadow-lg shadow-indigo-200">
                    {showMemberProfile.user_name?.[0]?.toUpperCase() || 'S'}
                  </div>
                  <h3 className="font-black text-gray-900 text-lg">{showMemberProfile.user_name}</h3>
                  {showMemberProfile.user_id === room.created_by && (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full mt-1">
                      <Crown size={11} /> Room Admin
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    ['🎓', 'Grade', showMemberProfile.user_grade ? `Grade ${showMemberProfile.user_grade}` : '—'],
                    ['🏫', 'School', showMemberProfile.user_school || '—'],
                    ['📍', 'District', showMemberProfile.user_district || '—'],
                    ['⚡', 'XP', (showMemberProfile.xp_points || 0).toLocaleString()],
                    ['🔥', 'Streak', `${showMemberProfile.streak_count || 0} days`],
                    ['🕐', 'Joined', new Date(showMemberProfile.joined_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })],
                  ].map(([emoji, label, value]) => (
                    <div key={label} className="bg-gray-50 rounded-2xl p-3 text-center">
                      <span className="text-xl block mb-1">{emoji}</span>
                      <p className="font-bold text-gray-800 text-sm">{value}</p>
                      <p className="text-gray-400 text-xs">{label}</p>
                    </div>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowMemberProfile(null)}
                  className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-2xl text-sm">Close</motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
