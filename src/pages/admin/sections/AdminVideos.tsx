import { useState, useEffect } from 'react';
import { Video, Plus, Trash2, Play, ExternalLink, Check, Filter } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function AdminVideos({ roleInfo }: any) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Bar State
  const [filterGrade, setFilterGrade] = useState<number | 'all'>(10);
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterChapter, setFilterChapter] = useState('');

  // Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [channelName, setChannelName] = useState('NEB Online Class');
  const [duration, setDuration] = useState('25:00');
  const [saving, setSaving] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const [subRes, vidRes] = await Promise.all([
        fetch('/api/admin/subjects').then(r => r.json()),
        fetch('/api/admin/videos').then(r => r.json()),
      ]);
      setSubjects(Array.isArray(subRes) ? subRes : []);
      setVideos(Array.isArray(vidRes) ? vidRes : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  // Filtered Subjects & Chapters
  const filteredSubjectsForGrade = filterGrade === 'all'
    ? subjects
    : subjects.filter(s => s.grade === filterGrade);

  const selectedUploadSub = subjects.find(s => String(s.id) === String(selectedSubjectId));
  const chaptersForUpload = selectedUploadSub?.chapters || [];

  const selectedFilterSub = subjects.find(s => String(s.id) === String(filterSubjectId));
  const chaptersForFilter = selectedFilterSub?.chapters || [];

  // Filtered Videos List
  const filteredVideos = videos.filter(v => {
    const matchGrade = filterGrade === 'all' || subjects.find(s => s.name === v.subject_name)?.grade === filterGrade;
    const matchSubject = !selectedFilterSub || v.subject_name === selectedFilterSub.name;
    const matchChapter = !filterChapter || String(v.chapter_id) === String(filterChapter) || (v.chapter_title && v.chapter_title.toLowerCase().includes(filterChapter.toLowerCase()));
    return matchGrade && matchSubject && matchChapter;
  });

  // Extract YouTube ID preview
  const extractId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const previewId = extractId(youtubeUrl);

  const saveVideo = async () => {
    if (!title.trim() || !youtubeUrl || !selectedUploadSub) return;
    setSaving(true);
    try {
      const chObj = chaptersForUpload.find((c: any) => String(c.id) === String(selectedChapter));
      await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_name: selectedUploadSub.name,
          chapter_id: selectedChapter || null,
          chapter_title: chObj?.title || 'General',
          title: title.trim(),
          youtube_url: youtubeUrl,
          duration,
          channel_name: channelName,
        }),
      });
      setTitle(''); setYoutubeUrl('');
      fetch_();
    } finally { setSaving(false); }
  };

  const deleteVideo = async (id: number) => {
    if (!confirm('Delete video?')) return;
    await fetch('/api/admin/videos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetch_();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Video size={24} className="text-rose-400" /> YouTube Video Lectures</h1>
        <p className="text-slate-400 text-sm mt-0.5">Filter lectures by Grade & Chapter. Extract YouTube video IDs server-side for clean embeds.</p>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
          <Filter size={14} /> Filter Video Lectures
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Grade</label>
            <select value={filterGrade} onChange={e => {
              const v = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
              setFilterGrade(v);
              setFilterSubjectId('');
              setFilterChapter('');
            }} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
              <option value="all">All Grades</option>
              {[8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Subject</label>
            <select value={filterSubjectId} onChange={e => { setFilterSubjectId(e.target.value); setFilterChapter(''); }} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
              <option value="">All Subjects</option>
              {filteredSubjectsForGrade.map(s => <option key={s.id} value={s.id}>{s.name} (Grade {s.grade})</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Chapter ({chaptersForFilter.length})</label>
            <select value={filterChapter} onChange={e => setFilterChapter(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
              <option value="">All Chapters ({chaptersForFilter.length})</option>
              {chaptersForFilter.map((c: any) => <option key={c.id} value={c.id}>{c.chapter_number}. {c.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <h3 className="font-bold text-white text-base">Add New Video Lecture</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Subject</label>
            <select value={selectedSubjectId} onChange={e => { setSelectedSubjectId(e.target.value); setSelectedChapter(''); }} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
              <option value="">Select subject…</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} (Grade {s.grade})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Chapter ({chaptersForUpload.length})</label>
            <select value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
              <option value="">Select chapter ({chaptersForUpload.length})…</option>
              {chaptersForUpload.map((c: any) => <option key={c.id} value={c.id}>{c.chapter_number}. {c.title}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Video Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Kinematics - Complete Motion in a Straight Line" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-400 mb-1 block">YouTube URL / Link</label>
            <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Channel / Faculty Name</label>
            <input value={channelName} onChange={e => setChannelName(e.target.value)} placeholder="NEB Online Class" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none" />
          </div>
        </div>

        {/* Live Thumbnail Preview */}
        {previewId && (
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
            <img src={`https://img.youtube.com/vi/${previewId}/mqdefault.jpg`} alt="thumb" className="w-24 h-16 object-cover rounded-xl" />
            <div>
              <p className="text-xs font-bold text-emerald-400">✅ Valid YouTube ID: {previewId}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Live thumbnail preview ready before publishing.</p>
            </div>
          </div>
        )}

        <button onClick={saveVideo} disabled={saving || !title.trim() || !youtubeUrl || !selectedSubjectId} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-2xl text-xs shadow-lg shadow-rose-500/20 disabled:opacity-40 transition-colors">
          {saving ? 'Publishing Video…' : 'Publish Video Lecture'}
        </button>
      </div>

      {/* Videos List */}
      {loading ? <LoadingSpinner size="lg" text="Loading videos…" /> : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Filtered Videos ({filteredVideos.length})</h3>
            <span className="text-xs text-slate-400">Grade: {filterGrade} · Subject: {selectedFilterSub?.name || 'All'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredVideos.map(v => (
              <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex gap-3 text-xs hover:border-slate-700 transition-colors">
                <img src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`} alt="" className="w-24 h-16 object-cover rounded-xl flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{v.title}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">{v.subject_name} · {v.chapter_title}</p>
                  <p className="text-rose-400 text-[10px] font-semibold mt-1">👤 {v.channel_name || 'NEB Teacher'}</p>
                </div>
                <button onClick={() => deleteVideo(v.id)} className="p-1.5 text-slate-500 hover:text-red-400 self-start">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {filteredVideos.length === 0 && (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-3xl">
              <Video size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm font-bold">No videos found for this filter</p>
              <p className="text-slate-500 text-xs mt-1">Try adjusting the Grade, Subject or Chapter filter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
