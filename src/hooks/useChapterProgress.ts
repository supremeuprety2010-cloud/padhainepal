import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface ChapterProgressEntry {
  chapter_id: number;
  status: ProgressStatus;
  mcq_count?: number;
  best_score?: number;
}

export function useChapterProgress(subject?: string) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Record<number, ChapterProgressEntry>>({});
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    if (!user) return;
    try {
      let url = `/api/chapter-progress?user_id=${user.id}`;
      if (subject) url += `&subject=${encodeURIComponent(subject)}`;
      const res = await fetch(url);
      const data = await res.json();
      const map: Record<number, ChapterProgressEntry> = {};
      (data || []).forEach((p: any) => { map[p.chapter_id] = p; });
      setProgress(map);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user, subject]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { progress, loading, refetch: fetch_ };
}
