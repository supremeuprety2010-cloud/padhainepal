import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Users, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AppHeader from '../../components/AppHeader';
import GlassCard from '../../components/GlassCard';
import { SUBJECT_COLORS, SUBJECT_ICONS } from '../../lib/subjectMeta';

export default function Study() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const subjects: string[] = profile?.subjects || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <AppHeader showLogo showActions />
      <div className="pt-16 px-4">
        <div className="pt-4 pb-4">
          <h1 className="text-2xl font-black text-gray-900">Study</h1>
          <p className="text-gray-400 text-sm mt-0.5">Grade {profile?.grade}{profile?.stream ? ` · ${profile.stream}` : ''}</p>
        </div>

        {/* Quick access */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <GlassCard hover onClick={() => navigate('/study-room')} className="p-4 flex items-center gap-3 border border-indigo-100">
            <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Users size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">Study Room</p>
              <p className="text-xs text-gray-400">Study with friends</p>
            </div>
          </GlassCard>
          <GlassCard hover onClick={() => navigate('/doubts')} className="p-4 flex items-center gap-3 border border-teal-100">
            <div className="w-10 h-10 bg-teal-100 rounded-2xl flex items-center justify-center">
              <MessageCircle size={18} className="text-teal-600" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">Doubts</p>
              <p className="text-xs text-gray-400">Ask questions</p>
            </div>
          </GlassCard>
        </div>

        <h2 className="font-bold text-gray-700 text-sm mb-3">Your Subjects</h2>
        <div className="space-y-3">
          {subjects.map((subj, i) => (
            <motion.div key={subj} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard hover onClick={() => navigate(`/study/${encodeURIComponent(subj)}`)} className="overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${SUBJECT_COLORS[subj] || 'from-gray-500 to-gray-600'} rounded-2xl flex items-center justify-center text-xl shadow-md flex-shrink-0`}>
                    {SUBJECT_ICONS[subj] || '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800">{subj}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Grade {profile?.grade} · 5 sections</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
          {subjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No subjects selected.</p>
              <button onClick={() => navigate('/onboarding')} className="text-blue-600 text-sm font-semibold mt-2">Update profile →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
