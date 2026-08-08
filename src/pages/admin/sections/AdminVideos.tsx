import { useState, useEffect } from 'react';
import { Video, Plus, Trash2, Play, Check, Filter, AlertCircle, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function AdminVideos({ roleInfo }: any) {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', error: false });

  // Filter State
  const [filterGrade, setFilterGrade] = useState<number | 'all'>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [channelName, setChannelName] = useState('NEB Online Class');
  const [duration, setDuration] = useState('20:00');
  const [saving, setSaving] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/videos');
      const data = await res.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  // Extract YouTube ID
  const extractId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url.trim();
  };

  const saveVideo = async () => {
    if (!title.trim()) {
      setMsg({ text: 'Please enter a video title', error: true });
      return;
    }
    if (!youtubeUrl.trim()) {
      setMsg({ text: 'Please enter a YouTube video URL or ID', error: true });
      return;
    }

    setSaving(true);
    setMsg({ text: '', error: false });

    const ytid = extractId(youtubeUrl.trim());

    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          youtube_id: ytid,
          subject_name: subjectName.trim() || 'Physics',
          chapter_title: chapterTitle.trim() || 'General',
          channel_name: channelName.trim() || 'NEB Educator',
          duration: duration.trim() || '15:00',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to save video');

      setMsg({ text: `✓ Video "${title.trim()}" published successfully!`, error: false });
      setTimeout(() => setMsg({ text: '', error: false }), 4000);

      setTitle(''); setYoutubeUrl(''); setChapterTitle('');
      await fetch_();
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to save video', error: true });
    } finally {
      setSaving(false);
    }
  };

  const deleteVideo = async (id: number) => {
    if (!confirm('Delete this video lecture?')) return;
    await fetch('/api/admin/videos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetch_();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Video size={24} className="text-rose-400" /> YouTube Video Lectures</h1>
        <p className="text-slate-400 text-sm mt-0.5">Organize chapter video lectures from top Nepali YouTube teachers.</p>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${msg.error ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
          {msg.error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />} {msg.text}
        </div>
      )}

      {/* Add New Video Form */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
        <h2 className="text-sm font-black text-white flex items-center gap-2"><Plus size={16} className="text-rose-400" /> Add YouTube Lecture</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-slate-300 font-bold block mb-1">Subject Name</label>
            <input type="text" placeholder="e.g. Physics, Accountancy" value={subjectName} onChange={e => setSubjectName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500" />
          </div>
          <div>
            <label className="text-slate-300 font-bold block mb-1">Chapter Title</label>
            <input type="text" placeholder="e.g. Wave Optics, Vectors" value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="sm:col-span-2">
            <label className="text-slate-300 font-bold block mb-1">Video Title</label>
            <input type="text" placeholder="e.g. Wave Optics - Young's Double Slit Experiment" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500" />
          </div>
          <div>
            <label className="text-slate-300 font-bold block mb-1">Channel / Teacher Name</label>
            <input type="text" placeholder="e.g. NEB Online Class" value={channelName} onChange={e => setChannelName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500" />
          </div>
        </div>

        <div>
          <label className="text-slate-300 font-bold block mb-1 text-xs">YouTube Video URL or Video ID</label>
          <input type="text" placeholder="https://www.youtube.com/watch?v=VIDEO_ID or video ID" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500" />
        </div>

        <button onClick={saveVideo} disabled={saving} className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/20 disabled:opacity-50">
          {saving ? 'Saving...' : 'Add Video Lecture'}
        </button>
      </div>

      {loading ? <LoadingSpinner size="lg" text="Loading Video Lectures..." /> : (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">Published Video Lectures ({videos.length})</h3>
          {videos.map(v => (
            <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs gap-3">
              <div>
                <p className="font-bold text-white text-sm">{v.title}</p>
                <p className="text-slate-400 mt-0.5">{v.subject_name} · {v.channel_name || 'NEB Teacher'} · ID #{v.id}</p>
              </div>
              <button onClick={() => deleteVideo(v.id)} className="text-slate-500 hover:text-red-400 p-1.5">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
