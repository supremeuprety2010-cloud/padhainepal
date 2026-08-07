import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function SubjectPPA({ subject }: { subject: string }) {
  const [analysis, setAnalysis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/past-paper-analysis?subject=${encodeURIComponent(subject)}`)
      .then(r => r.json()).then(setAnalysis).catch(() => {}).finally(() => setLoading(false));
  }, [subject]);

  const max = Math.max(...analysis.map((a: any) => a.question_count || 0), 1);

  return (
    <div className="px-4 pt-4">
      <GlassCard className="p-3.5 mb-4 bg-purple-50/50 border border-purple-200">
        <div className="flex items-start gap-2">
          <TrendingUp size={14} className="text-purple-600 mt-0.5" />
          <p className="text-xs text-purple-800">Based on NEB past exam papers. Longer bars = more questions historically.</p>
        </div>
      </GlassCard>
      {loading ? <LoadingSpinner size="lg" text="Analyzing..." /> : (
        <div className="space-y-3">
          {analysis.map((item: any, i: number) => {
            const pct = Math.round((item.question_count / max) * 100);
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <GlassCard className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-800 text-sm">{item.chapter_title}</p>
                    <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">{item.question_count} Qs</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.04 + 0.2, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-purple-500 to-violet-600 rounded-full" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{item.weightage_pct || pct}% weightage{item.years_appeared ? ` · ${item.years_appeared}` : ''}</p>
                </GlassCard>
              </motion.div>
            );
          })}
          {analysis.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No past paper data yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
