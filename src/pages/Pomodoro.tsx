import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, BookOpen, Music, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/GlassCard';
import BackButton from '../components/BackButton';

type Mode = 'focus' | 'short_break' | 'long_break';

const DURATIONS: Record<Mode, number> = { focus: 25 * 60, short_break: 5 * 60, long_break: 15 * 60 };
const LABELS: Record<Mode, string> = { focus: 'Focus Time', short_break: 'Short Break', long_break: 'Long Break' };

interface SoundTrack {
  id: string;
  name: string;
  emoji: string;
  type: 'rain' | 'lofi' | 'waves' | 'forest' | 'noise';
}

const SOUND_TRACKS: SoundTrack[] = [
  { id: 'rain', name: 'Gentle Rain', emoji: '🌧️', type: 'rain' },
  { id: 'lofi', name: 'Chill Lo-Fi Beats', emoji: '☕', type: 'lofi' },
  { id: 'waves', name: 'Ocean Waves', emoji: '🌊', type: 'waves' },
  { id: 'forest', name: 'Forest Birds', emoji: '🌲', type: 'forest' },
  { id: 'noise', name: 'Deep White Noise', emoji: '🎧', type: 'noise' },
];

export default function Pomodoro() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('focus');
  const [timeLeft, setTimeLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [totalFocusToday, setTotalFocusToday] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  // Ambient Music & Sound State
  const [activeTrack, setActiveTrack] = useState<SoundTrack>(SOUND_TRACKS[0]);
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // Web Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeNodesRef = useRef<any[]>([]);

  useEffect(() => {
    if (user) {
      fetch(`/api/pomodoro?user_id=${user.id}`).then(r => r.json()).then(d => setTotalFocusToday(d.today_minutes || 0)).catch(() => {});
    }
  }, [user]);

  // Web Audio Synthetic Ambient Sound Generator
  const stopAmbientAudio = () => {
    try {
      activeNodesRef.current.forEach(node => {
        try { node.stop?.(); node.disconnect?.(); } catch {}
      });
      activeNodesRef.current = [];
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.suspend();
      }
    } catch {}
  };

  const startAmbientAudio = (track: SoundTrack) => {
    stopAmbientAudio();
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      activeNodesRef.current.push(masterGain);

      if (track.type === 'rain' || track.type === 'noise') {
        // Buffer pink/white noise
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (track.type === 'rain') {
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11;
            b6 = white * 0.115926;
          } else {
            output[i] = white * 0.08;
          }
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(track.type === 'rain' ? 800 : 1200, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();
        activeNodesRef.current.push(whiteNoise, filter);
      } else if (track.type === 'waves') {
        // Ocean Waves (modulated filter noise)
        const bufferSize = ctx.sampleRate * 3;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.12;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';

        // LFO for surf modulation
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(400, ctx.currentTime);

        filter.frequency.setValueAtTime(500, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        noise.connect(filter);
        filter.connect(masterGain);
        noise.start();
        lfo.start();
        activeNodesRef.current.push(noise, filter, lfo, lfoGain);
      } else if (track.type === 'lofi') {
        // Relaxing Lo-Fi Chords
        const chordFreqs = [261.63, 329.63, 392.00, 523.25]; // C major 7th harmonic
        chordFreqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          const lfo = ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.2 + idx * 0.1, ctx.currentTime);
          const oscGain = ctx.createGain();
          oscGain.gain.setValueAtTime(0.04, ctx.currentTime);

          lfo.connect(oscGain.gain);
          osc.connect(oscGain);
          oscGain.connect(masterGain);
          osc.start();
          lfo.start();
          activeNodesRef.current.push(osc, lfo, oscGain);
        });
      } else if (track.type === 'forest') {
        // Forest birds chirping ambience
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { output[i] = (Math.random() * 2 - 1) * 0.03; }
        const wind = ctx.createBufferSource();
        wind.buffer = noiseBuffer;
        wind.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);
        wind.connect(filter);
        filter.connect(masterGain);
        wind.start();
        activeNodesRef.current.push(wind, filter);
      }
    } catch (e) {
      console.error('Ambient Audio Error:', e);
    }
  };

  useEffect(() => {
    if (soundPlaying) {
      startAmbientAudio(activeTrack);
    } else {
      stopAmbientAudio();
    }
    return () => { stopAmbientAudio(); };
  }, [soundPlaying, activeTrack]);

  const toggleSound = () => {
    setSoundPlaying(prev => !prev);
  };

  useEffect(() => {
    if (running) {
      startRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            if (mode === 'focus') {
              setSessions(s => s + 1);
              saveSesion();
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const saveSesion = () => {
    if (!user) return;
    const duration = Math.round((Date.now() - startRef.current) / 60000);
    fetch('/api/pomodoro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, duration_minutes: duration || 25, session_type: 'focus' }),
    }).catch(() => {});
  };

  const switchMode = (m: Mode) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setMode(m);
    setTimeLeft(DURATIONS[m]);
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setTimeLeft(DURATIONS[mode]);
  };

  const pct = ((DURATIONS[mode] - timeLeft) / DURATIONS[mode]) * 100;
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const circumference = 2 * Math.PI * 110;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 pb-24 flex flex-col">
      {/* Top Header with Back Button */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <BackButton light fallback="/home" />
        <div className="text-right">
          <p className="text-white/40 text-xs">Pomodoro Mode</p>
          <p className="text-white text-xs font-bold">{LABELS[mode]}</p>
        </div>
      </div>

      <div className="px-5 pb-2">
        <h1 className="text-white text-2xl font-black">Focus Timer 🍅</h1>
        <p className="text-white/50 text-sm">Stay focused, study with ambient audio</p>
      </div>

      {/* Mode Selector */}
      <div className="px-5 mb-6">
        <div className="flex bg-white/10 rounded-2xl p-1 gap-1">
          {(['focus', 'short_break', 'long_break'] as Mode[]).map(m => (
            <motion.button key={m} whileTap={{ scale: 0.95 }} onClick={() => switchMode(m)} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${mode === m ? 'bg-white text-gray-800 shadow-md' : 'text-white/50'}`}>
              {m === 'focus' ? '🎯 Focus' : m === 'short_break' ? '☕ Short' : '🌙 Long'}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Timer Circle */}
      <div className="flex-1 flex items-center justify-center px-5 my-2">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="110" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <circle cx="120" cy="120" r="110" fill="none" stroke={mode === 'focus' ? '#3b82f6' : '#22c55e'} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={circumference - (pct / 100) * circumference} strokeLinecap="round" className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-white text-5xl sm:text-6xl font-black tabular-nums tracking-tight">{mins}:{secs}</span>
            <span className="text-white/50 text-sm mt-1 font-medium">{LABELS[mode]}</span>
            {mode === 'focus' && sessions > 0 && <span className="text-amber-300 text-xs font-bold mt-1.5 flex items-center gap-1"><Sparkles size={11} /> Session #{sessions + 1}</span>}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 pb-4 space-y-4 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-center gap-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={reset} className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white/70 hover:text-white transition-colors" title="Reset Timer">
            <RotateCcw size={22} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setRunning(r => !r)} className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl transition-all ${mode === 'focus' ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30' : 'bg-green-500 hover:bg-green-600 shadow-green-500/30'}`}>
            {running ? <Pause size={32} className="text-white" /> : <Play size={32} className="text-white ml-1" />}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => switchMode(mode === 'focus' ? 'short_break' : 'focus')} className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white/70 hover:text-white transition-colors" title="Switch Mode">
            {mode === 'focus' ? <Coffee size={22} /> : <BookOpen size={22} />}
          </motion.button>
        </div>

        {/* Study Ambient Audio Player Widget */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/15 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/30 flex items-center justify-center border border-blue-400/40">
                <Music size={16} className="text-blue-300" />
              </div>
              <div>
                <p className="text-xs font-black text-white flex items-center gap-1.5">
                  Study Ambient Audio
                  {soundPlaying && <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
                </p>
                <p className="text-[10px] text-white/50">Relaxing background sounds for deep focus</p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleSound}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                soundPlaying ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/15 text-white/70 hover:bg-white/25'
              }`}
            >
              {soundPlaying ? <Volume2 size={13} /> : <VolumeX size={13} />}
              <span>{soundPlaying ? 'Playing' : 'Play Sound'}</span>
            </motion.button>
          </div>

          {/* Sound Track Selector Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {SOUND_TRACKS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTrack(t);
                  if (!soundPlaying) setSoundPlaying(true);
                }}
                className={`px-3 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all border ${
                  activeTrack.id === t.id
                    ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                }`}
              >
                <span>{t.emoji}</span>
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="p-4 bg-white/5 border-white/10 text-center">
            <p className="text-2xl font-black text-white">{sessions}</p>
            <p className="text-white/50 text-xs">Sessions today</p>
          </GlassCard>
          <GlassCard className="p-4 bg-white/5 border-white/10 text-center">
            <p className="text-2xl font-black text-white">{totalFocusToday + sessions * 25}</p>
            <p className="text-white/50 text-xs">Minutes focused</p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
