import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Target, Video, CheckSquare, MessageCircle, Sparkles,
  Flame, Trophy, Clock, ChevronRight, Star, Zap, Shield, Users,
  BarChart3, Play, Menu, X, ArrowRight, Check, MapPin, GraduationCap,
  Brain, Award, TrendingUp, Globe, Heart
} from 'lucide-react';

// ─── NAV ────────────────────────────────────────────────────────────────────
function Navbar({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = [
    { label: 'Home', id: 'home' },
    { label: 'Features', id: 'features' },
    { label: 'About Us', id: 'about' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-lg shadow-blue-500/5 border-b border-white/60' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
        {/* Logo */}
        <motion.div whileTap={{ scale: 0.97 }} onClick={() => onNavigate('home')} className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <span className="font-black text-lg text-gray-900">Padhai</span>
            <span className="font-black text-lg text-blue-600">Nepal</span>
          </div>
        </motion.div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <button key={l.id} onClick={() => onNavigate(l.id)} className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">
              {l.label}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">Sign In</button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/login')} className="bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors flex items-center gap-1.5">
            Get Started Free <ArrowRight size={14} />
          </motion.button>
        </div>

        {/* Mobile menu */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-xl bg-gray-100">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="md:hidden bg-white/95 backdrop-blur-xl border-b border-gray-100 px-5 py-4 space-y-3">
            {links.map(l => (
              <button key={l.id} onClick={() => { onNavigate(l.id); setOpen(false); }} className="block w-full text-left text-gray-700 font-medium py-2 text-sm">
                {l.label}
              </button>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={() => navigate('/login')} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm">Sign In</button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/login')} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-blue-200">
                Get Started
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── HERO ────────────────────────────────────────────────────────────────────
function HeroSection({ onNavigate }: { onNavigate: (id: string) => void }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const stats = [
    { value: '10,000+', label: 'Students' },
    { value: '5,000+', label: 'MCQs' },
    { value: '8–12', label: 'Grades' },
    { value: '3 Days', label: 'Free Trial' },
  ];

  return (
    <section ref={ref} id="home" className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <motion.div style={{ y }} className="absolute inset-0">
        <img src="/nepal-hero.jpg" alt="Nepal mountains" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 via-indigo-900/60 to-slate-900/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-transparent" />
      </motion.div>

      {/* Floating glass blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <motion.div style={{ opacity }} className="relative flex-1 flex flex-col items-center justify-center text-center px-5 pt-24 pb-16 max-w-4xl mx-auto w-full">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-4 py-2 mb-8">
          <span className="text-base">🇳🇵</span>
          <span className="text-white/90 text-sm font-medium">Built exclusively for Nepal's NEB students</span>
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
          Study Smarter,{' '}
          <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Score Higher
          </span>
          <br />
          <span className="text-3xl md:text-5xl lg:text-6xl text-white/80">for NEB Exams</span>
        </motion.h1>

        {/* Sub */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Nepal's most complete EdTech platform for Grade 8–12. Practice MCQs, take mock tests, watch video lectures, and get help from our AI tutor — all in Nepali curriculum.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row gap-3 mb-14">
          <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }} onClick={() => navigate('/login')} className="bg-white text-blue-700 font-black px-8 py-4 rounded-2xl text-base shadow-2xl flex items-center justify-center gap-2">
            Start Free Trial <ArrowRight size={18} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => onNavigate('features')} className="bg-white/10 backdrop-blur-xl border border-white/20 text-white font-bold px-8 py-4 rounded-2xl text-base flex items-center justify-center gap-2">
            <Play size={16} fill="white" /> See Features
          </motion.button>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.08 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-white/60 text-xs mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="relative flex justify-center pb-8">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center pt-2">
          <div className="w-1 h-2 bg-white/60 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── FEATURES ────────────────────────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    {
      icon: Target,
      color: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      title: 'MCQ Practice Engine',
      desc: 'Thousands of NEB-curriculum questions with instant feedback, explanations, and weak-area detection. Filter by subject and chapter.',
      tags: ['Instant Feedback', 'Explanations', 'Weak Area Detection'],
    },
    {
      icon: BarChart3,
      color: 'from-purple-500 to-violet-600',
      bg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      title: 'Mock Test Engine',
      desc: 'Simulate real NEB exams with timed tests. Chapter-wise, subject-wise, or full exam mode. Get detailed report cards after each attempt.',
      tags: ['Timed Tests', 'Auto-Submit', 'Report Card'],
    },
    {
      icon: Video,
      color: 'from-rose-500 to-pink-600',
      bg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      title: 'Video Lectures',
      desc: 'Chapter-wise video lectures by expert NEB teachers. Watch at your own pace, pause, rewind, and learn from the best.',
      tags: ['Expert Teachers', 'Chapter-wise', 'Any Device'],
    },
    {
      icon: Sparkles,
      color: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      title: 'Nep AI Tutor',
      desc: 'Ask any NEB question and get curriculum-accurate answers instantly. Our AI is trained on NEB syllabus for Grades 8–12.',
      tags: ['NEB Curriculum', '10 Free/Day', '24/7 Available'],
    },
    {
      icon: CheckSquare,
      color: 'from-green-500 to-emerald-600',
      bg: 'bg-green-50',
      iconColor: 'text-green-600',
      title: 'Chapter Tracker',
      desc: 'Visually track your progress chapter by chapter. Mark chapters as Not Started, In Progress, or Done. Never lose track again.',
      tags: ['Visual Progress', 'Per Subject', 'XP Rewards'],
    },
    {
      icon: MessageCircle,
      color: 'from-teal-500 to-cyan-600',
      bg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      title: 'Doubts Forum',
      desc: 'Ask questions, get answers from peers and teachers. Subject-filtered community where no doubt goes unanswered.',
      tags: ['Peer Learning', 'Subject Filters', 'Upvotes'],
    },
    {
      icon: Trophy,
      color: 'from-yellow-500 to-amber-600',
      bg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      title: 'Gamification & XP',
      desc: 'Earn XP points, maintain streaks, and compete on leaderboards — global, school-level, and district-level so it stays winnable.',
      tags: ['XP Points', 'Streaks', 'Leaderboards'],
    },
    {
      icon: Clock,
      color: 'from-indigo-500 to-blue-600',
      bg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      title: 'Pomodoro Focus Timer',
      desc: 'Built-in Pomodoro timer for distraction-free study sessions. Track your daily focus minutes and build a study habit.',
      tags: ['25 min Focus', 'Session Tracking', 'Habit Building'],
    },
  ];

  return (
    <section id="features" className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 mb-5">
            <Zap size={14} className="text-blue-600" />
            <span className="text-blue-700 text-sm font-semibold">Everything you need to ace NEB</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-5">
            One Platform,{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Every Tool
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            From MCQ practice to AI tutoring — everything a Nepali student needs to prepare for NEB exams, all in one place.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} whileHover={{ y: -4 }} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group cursor-default">
                <div className={`w-11 h-11 ${f.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className={f.iconColor} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm leading-snug">{f.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed mb-3">{f.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {f.tags.map(t => (
                    <span key={t} className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Banner */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative">
            <p className="text-blue-200 text-sm font-semibold mb-2">Limited Time</p>
            <h3 className="text-white text-2xl md:text-3xl font-black mb-3">Start Your Free 3-Day Trial</h3>
            <p className="text-blue-200 mb-6 max-w-lg mx-auto">No credit card needed. Access all features free for 3 days. Then subscribe for just NPR 999/year.</p>
            <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }} onClick={() => window.location.href = '/login'} className="bg-white text-blue-700 font-black px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-2 mx-auto">
              Get Free Access <ArrowRight size={18} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: '01', icon: GraduationCap, title: 'Create Account', desc: 'Sign up with your email or phone number in under 60 seconds. No credit card required.' },
    { num: '02', icon: BookOpen, title: 'Set Your Profile', desc: 'Choose your grade (8–12), stream, subjects, and school. We personalize everything for you.' },
    { num: '03', icon: Target, title: 'Start Practicing', desc: 'Practice MCQs, take mock tests, watch videos, and ask the AI tutor — all tailored to NEB.' },
    { num: '04', icon: Trophy, title: 'Track & Win', desc: 'Earn XP, climb leaderboards, and watch your scores improve every week.' },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-blue-50/50">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
            Up & Running in{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">4 Steps</span>
          </h2>
          <p className="text-gray-500 text-lg">Getting started with PadhaiNepal is incredibly simple</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-blue-200 to-transparent z-0" style={{ width: 'calc(100% - 2rem)' }} />
                )}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl font-black text-blue-100">{s.num}</span>
                    <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
                      <Icon size={18} className="text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── SUBJECTS ─────────────────────────────────────────────────────────────────
function SubjectsSection() {
  const subjects = [
    { name: 'Mathematics', icon: '📐', grades: '8–12', color: 'from-blue-500 to-indigo-600' },
    { name: 'Physics', icon: '⚛️', grades: '11–12', color: 'from-purple-500 to-violet-600' },
    { name: 'Chemistry', icon: '🧪', grades: '11–12', color: 'from-green-500 to-emerald-600' },
    { name: 'Biology', icon: '🧬', grades: '11–12', color: 'from-teal-500 to-cyan-600' },
    { name: 'Science', icon: '🔬', grades: '8–10', color: 'from-sky-500 to-blue-600' },
    { name: 'English', icon: '📖', grades: '8–12', color: 'from-pink-500 to-rose-600' },
    { name: 'Nepali', icon: '🇳🇵', grades: '8–12', color: 'from-red-500 to-orange-600' },
    { name: 'Computer Science', icon: '💻', grades: '8–12', color: 'from-orange-500 to-amber-600' },
    { name: 'Accountancy', icon: '📊', grades: '11–12', color: 'from-yellow-500 to-amber-600' },
    { name: 'Economics', icon: '📈', grades: '11–12', color: 'from-lime-500 to-green-600' },
    { name: 'Social Studies', icon: '🌍', grades: '8–10', color: 'from-amber-500 to-orange-600' },
    { name: 'Business Studies', icon: '💼', grades: '11–12', color: 'from-slate-500 to-gray-600' },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">All NEB Subjects Covered</h2>
          <p className="text-gray-500">Complete coverage for all streams — Science, Management & Humanities</p>
        </motion.div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {subjects.map((s, i) => (
            <motion.div key={s.name} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} whileHover={{ y: -3, scale: 1.03 }} className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm hover:shadow-md transition-all cursor-default">
              <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mx-auto mb-2 text-xl`}>
                {s.icon}
              </div>
              <p className="font-semibold text-gray-800 text-xs leading-tight">{s.name}</p>
              <p className="text-gray-400 text-xs mt-0.5">Gr. {s.grades}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
function Testimonials() {
  const reviews = [
    { name: 'Aarav Sharma', grade: 'Grade 12 Science', school: 'Budhanilkantha School', text: 'PadhaiNepal helped me score 3.8 GPA in NEB! The MCQ practice and mock tests are exactly like the real exam. The AI tutor is incredible.', rating: 5, avatar: 'A' },
    { name: 'Priya Thapa', grade: 'Grade 11 Management', school: 'St. Xavier\'s School', text: 'I used to struggle with Accountancy, but the chapter-wise videos and practice questions made everything so clear. My confidence shot up!', rating: 5, avatar: 'P' },
    { name: 'Rohan Karki', grade: 'Grade 10', school: 'Kathmandu Model School', text: 'The Pomodoro timer and daily missions keep me disciplined. I study 3 hours daily now without getting distracted. Best study app for Nepal!', rating: 5, avatar: 'R' },
    { name: 'Sita Rai', grade: 'Grade 12 Science', school: 'Pokhara Secondary School', text: 'Being from Pokhara, I didn\'t have access to good coaching. PadhaiNepal gave me everything I needed. Scored 95% in Physics!', rating: 5, avatar: 'S' },
    { name: 'Bikash Gurung', grade: 'Grade 9', school: 'Biratnagar Secondary School', text: 'The leaderboard is so motivating! Competing with friends from school makes studying fun. I\'ve maintained a 45-day streak!', rating: 5, avatar: 'B' },
    { name: 'Anisha Tamang', grade: 'Grade 11 Humanities', school: 'Lalitpur Secondary School', text: 'Finally an app that covers Sociology and History for Humanities stream. The doubts forum is super helpful — teachers answer within hours!', rating: 5, avatar: 'A' },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-blue-50/50 to-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="#f59e0b" className="text-amber-400" />)}
            <span className="text-gray-600 text-sm font-semibold ml-2">4.9/5 from 2,000+ students</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
            Students Love{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">PadhaiNepal</span>
          </h2>
          <p className="text-gray-500 text-lg">Real stories from real Nepali students</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((r, i) => (
            <motion.div key={r.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(r.rating)].map((_, j) => <Star key={j} size={14} fill="#f59e0b" className="text-amber-400" />)}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">"{r.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {r.avatar}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{r.name}</p>
                  <p className="text-gray-400 text-xs">{r.grade} · {r.school}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PRICING ──────────────────────────────────────────────────────────────────
function PricingSection() {
  const navigate = useNavigate();
  const plans = [
    { grade: 'Grade 8–9', price: 999, features: ['All subjects', 'MCQ Practice', 'Mock Tests', 'AI Tutor (10/day)', 'Video Lectures', 'Chapter Tracker', 'Doubts Forum', 'Leaderboard'] },
    { grade: 'Grade 10 (SEE)', price: 1299, popular: true, features: ['All subjects', 'MCQ Practice', 'Mock Tests', 'AI Tutor (10/day)', 'Video Lectures', 'Chapter Tracker', 'Doubts Forum', 'Leaderboard', 'SEE Past Papers', 'Priority Support'] },
    { grade: 'Grade 11–12 (NEB)', price: 1499, features: ['All subjects + streams', 'MCQ Practice', 'Mock Tests', 'AI Tutor (10/day)', 'Video Lectures', 'Chapter Tracker', 'Doubts Forum', 'Leaderboard', 'NEB Past Papers', 'Priority Support'] },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 rounded-full px-4 py-2 mb-5">
            <Shield size={14} className="text-green-600" />
            <span className="text-green-700 text-sm font-semibold">3-day free trial · No credit card needed</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
            Simple,{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Affordable</span>{' '}
            Pricing
          </h2>
          <p className="text-gray-500 text-lg">In NPR. One-year access. Cancel anytime.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div key={plan.grade} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className={`relative bg-white rounded-3xl p-7 border-2 transition-all ${plan.popular ? 'border-blue-500 shadow-2xl shadow-blue-100 scale-105' : 'border-gray-100 shadow-sm'}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <p className="text-gray-500 text-sm font-medium mb-1">{plan.grade}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-gray-500 text-sm font-bold">NPR</span>
                  <span className="text-4xl font-black text-gray-900">{plan.price.toLocaleString()}</span>
                  <span className="text-gray-400 text-sm">/year</span>
                </div>
                <p className="text-gray-400 text-xs mt-1">≈ NPR {Math.round(plan.price / 12)}/month</p>
              </div>
              <ul className="space-y-2.5 mb-7">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={10} className="text-green-600" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/login')} className={`w-full font-bold py-3.5 rounded-2xl text-sm transition-all ${plan.popular ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                Start Free Trial
              </motion.button>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-gray-500">
          {['✅ eSewa & Khalti accepted', '🔒 Secure payment', '📱 Works on any device', '🔄 Cancel anytime'].map(t => (
            <span key={t}>{t}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── ABOUT ────────────────────────────────────────────────────────────────────
function AboutSection() {
  const values = [
    { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', title: 'Built for Nepal', desc: 'Every feature is designed specifically for NEB curriculum — not adapted from foreign platforms.' },
    { icon: Globe, color: 'text-blue-500', bg: 'bg-blue-50', title: 'Accessible Everywhere', desc: 'From Kathmandu to Humla — works on low-end Android phones with slow internet.' },
    { icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50', title: 'AI-Powered Learning', desc: 'Our Nep AI tutor understands Nepali curriculum context, not just generic answers.' },
    { icon: Award, color: 'text-amber-500', bg: 'bg-amber-50', title: 'Proven Results', desc: 'Students using PadhaiNepal consistently improve their NEB scores by 20–30%.' },
  ];

  const team = [
    { name: 'Rajesh Adhikari', role: 'CEO & Co-Founder', desc: 'Former NEB topper, IIT graduate passionate about Nepal education', avatar: 'R' },
    { name: 'Sunita Poudel', role: 'Head of Curriculum', desc: '10+ years NEB teaching experience, content architect', avatar: 'S' },
    { name: 'Anil Shrestha', role: 'CTO', desc: 'Full-stack engineer, built EdTech platforms across South Asia', avatar: 'A' },
  ];

  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        {/* Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 mb-6">
              <MapPin size={14} className="text-blue-600" />
              <span className="text-blue-700 text-sm font-semibold">Made in Nepal, for Nepal 🇳🇵</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              Our Mission: Make Quality Education{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Accessible to Every Nepali Student</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              We started PadhaiNepal because we saw talented students from outside Kathmandu valley being left behind — not because they lacked potential, but because they lacked access to quality study resources.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              Our platform brings the same quality of preparation that Kathmandu students get from expensive coaching centers — to every student, in every district of Nepal, at a fraction of the cost.
            </p>
            <div className="flex flex-wrap gap-4">
              {[['10,000+', 'Students'], ['77', 'Districts Covered'], ['5,000+', 'Questions'], ['4.9★', 'Rating']].map(([val, label]) => (
                <div key={label} className="bg-blue-50 rounded-2xl px-5 py-3 text-center">
                  <p className="text-xl font-black text-blue-700">{val}</p>
                  <p className="text-blue-500 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl shadow-blue-100">
              <img src="/students.jpg" alt="Nepali students studying" className="w-full h-80 object-cover" />
            </div>
            {/* Floating card */}
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute -bottom-6 -left-6 bg-white border border-gray-100 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm">+30% Score Improvement</p>
                  <p className="text-gray-400 text-xs">Average after 1 month</p>
                </div>
              </div>
            </motion.div>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 3, delay: 1.5 }} className="absolute -top-6 -right-6 bg-white border border-gray-100 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Users size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm">10,000+ Students</p>
                  <p className="text-gray-400 text-xs">Across all 77 districts</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Values */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-24">
          <h3 className="text-2xl md:text-3xl font-black text-gray-900 text-center mb-10">What We Stand For</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm text-center hover:shadow-md transition-all">
                  <div className={`w-12 h-12 ${v.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <Icon size={22} className={v.color} />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">{v.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Team */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h3 className="text-2xl md:text-3xl font-black text-gray-900 text-center mb-10">Meet the Team</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm text-center hover:shadow-md transition-all">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black mx-auto mb-4 shadow-lg shadow-blue-200">
                  {t.avatar}
                </div>
                <h4 className="font-black text-gray-900 mb-1">{t.name}</h4>
                <p className="text-blue-600 text-sm font-semibold mb-3">{t.role}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── FINAL CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  const navigate = useNavigate();
  return (
    <section className="py-24 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-3xl mx-auto px-5 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-5 leading-tight">
            Your NEB Success Story Starts Today
          </h2>
          <p className="text-blue-200 text-lg mb-10 max-w-xl mx-auto">
            Join 10,000+ Nepali students already studying smarter. 3-day free trial. No credit card. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }} onClick={() => navigate('/login')} className="bg-white text-blue-700 font-black px-10 py-4 rounded-2xl text-lg shadow-2xl flex items-center justify-center gap-2">
              Start Free — It's Free! <ArrowRight size={20} />
            </motion.button>
          </div>
          <p className="text-blue-300 text-sm mt-5">✅ eSewa & Khalti · 🔒 Safe & Secure · 🇳🇵 Made in Nepal</p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer({ onNavigate }: { onNavigate: (id: string) => void }) {
  const navigate = useNavigate();
  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <BookOpen size={18} className="text-white" />
              </div>
              <span className="font-black text-xl">PadhaiNepal</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-5 max-w-xs">
              Nepal's #1 EdTech platform for Grade 8–12 NEB students. Accessible, affordable, and built for every corner of Nepal.
            </p>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <MapPin size={14} />
              <span>Kathmandu, Nepal 🇳🇵</span>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 text-sm">Platform</h4>
            <ul className="space-y-2.5 text-slate-400 text-sm">
              {['Home', 'Features', 'About Us'].map(l => (
                <li key={l}><button onClick={() => onNavigate(l.toLowerCase().replace(' ', '-').replace(' us', ''))} className="hover:text-white transition-colors">{l}</button></li>
              ))}
              <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Sign In</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 text-sm">Subjects</h4>
            <ul className="space-y-2.5 text-slate-400 text-sm">
              {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'].map(s => (
                <li key={s}><span className="hover:text-white transition-colors cursor-default">{s}</span></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">© 2025 PadhaiNepal. All rights reserved.</p>
          <p className="text-slate-500 text-sm flex items-center gap-1">Made with <Heart size={12} className="text-rose-500" fill="currentColor" /> for Nepal's students</p>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN LANDING ─────────────────────────────────────────────────────────────
export default function Landing() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id === 'about-us' ? 'about' : id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen">
      <Navbar onNavigate={scrollTo} />
      <HeroSection onNavigate={scrollTo} />
      <FeaturesSection />
      <HowItWorks />
      <SubjectsSection />
      <Testimonials />
      <PricingSection />
      <AboutSection />
      <FinalCTA />
      <Footer onNavigate={scrollTo} />
    </div>
  );
}
