import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, BarChart3, Video, CheckSquare, MessageCircle, ChevronRight } from 'lucide-react';
import BackButton from '../components/BackButton';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../contexts/AuthContext';

const SUBJECT_GRADIENTS: Record<string, string> = {
  Mathematics: 'from-blue-600 to-indigo-700',
  Physics: 'from-purple-600 to-violet-700',
  Chemistry: 'from-green-600 to-emerald-700',
  Biology: 'from-teal-600 to-cyan-700',
  'Computer Science': 'from-orange-600 to-amber-700',
  English: 'from-pink-600 to-rose-700',
  Nepali: 'from-red-600 to-orange-700',
};

const cards = [
  {
    id: 'practice',
    icon: Target,
    title: 'Start Practice',
    subtitle: 'Guided journey: chapter by chapter',
    desc: 'Practice MCQs chapter-wise with instant feedback and explanations',
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    path: (subject: string) => `/practice?subject=${encodeURIComponent(subject)}`,
  },
  {
    id: 'analysis',
    icon: BarChart3,
    title: 'Past Paper Analysis',
    subtitle: 'Topic frequency & weightage trends',
    desc: 'See which chapters appear most in NEB exams',
    color: 'bg-purple-50 border-purple-200',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
    path: (subject: string) => `/past-papers?subject=${encodeURIComponent(subject)}`,
  },
  {
    id: 'videos',
    icon: Video,
    title: 'Watch Videos',
    subtitle: 'Chapter-wise faculty lectures',
    desc: 'Learn from expert teachers with video explanations',
    color: 'bg-rose-50 border-rose-200',
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-100',
    path: (subject: string) => `/videos?subject=${encodeURIComponent(subject)}`,
  },
  {
    id: 'tracker',
    icon: CheckSquare,
    title: 'Chapter Tracker',
    subtitle: 'Per-chapter progress tracking',
    desc: 'Mark chapters as done and track your coverage',
    color: 'bg-green-50 border-green-200',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    path: (subject: string) => `/chapters?subject=${encodeURIComponent(subject)}`,
  },
  {
    id: 'doubts',
    icon: MessageCircle,
    title: 'Doubts Forum',
    subtitle: 'Ask questions, get answers',
    desc: 'Connect with peers and teachers for subject-specific help',
    color: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
    path: (subject: string) => `/community?subject=${encodeURIComponent(subject)}`,
  },
];

export default function SubjectDashboard() {
  const { subject } = useParams<{ subject: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const decodedSubject = decodeURIComponent(subject || '');
  const gradient = SUBJECT_GRADIENTS[decodedSubject] || 'from-blue-600 to-indigo-700';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-24">
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradient} px-5 pt-12 pb-8`}>
        <BackButton light fallback="/study" />
        <h1 className="text-white text-2xl font-black">{decodedSubject}</h1>
        <p className="text-white/70 text-sm mt-1">Grade {profile?.grade} · {profile?.stream || 'NEB'}</p>
      </div>

      <div className="px-5 -mt-4 space-y-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <GlassCard hover onClick={() => navigate(card.path(decodedSubject))} className={`p-4 border ${card.color}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${card.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    <Icon size={22} className={card.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800">{card.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{card.subtitle}</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
