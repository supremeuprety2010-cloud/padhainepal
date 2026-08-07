import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Eye } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function SubjectVideos({ subject }: { subject: string }) {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/videos?subject=${encodeURIComponent(subject)}`)
      .then(r => r.json()).then(setVideos).catch(() => {}).finally(() => setLoading(false));
  }, [subject]);

  return (
    <div className="px-4 pt-4">
      {loading ? <LoadingSpinner size="lg" text="Loading videos..." /> : (
        <div className="space-y-3">
          {playing && (
            <GlassCard className="overflow-hidden">
              <div className="aspect-video">
                <iframe src={`https://www.youtube.com/embed/${playing}?autoplay=1`} className="w-full h-full" allowFullScreen allow="autoplay" />
              </div>
            </GlassCard>
          )}
          {videos.map((v: any, i: number) => (
            <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard hover onClick={() => setPlaying(v.youtube_id || v.video_url)} className="overflow-hidden">
                <div className="flex gap-3 p-3">
                  <div className="relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {v.youtube_id && <img src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`} alt={v.title} className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                        <Play size={13} className="text-gray-800 ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm line-clamp-2">{v.title}</p>
                    {v.chapter_title && <p className="text-xs text-gray-500 mt-0.5">{v.chapter_title}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      {v.duration && <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={10} />{v.duration}</span>}
                      {v.views && <span className="flex items-center gap-1 text-xs text-gray-400"><Eye size={10} />{v.views}</span>}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
          {videos.length === 0 && (
            <div className="text-center py-12">
              <Play size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No videos available yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
