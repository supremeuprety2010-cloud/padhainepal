import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, Trash2, ExternalLink, Filter, GraduationCap, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function AdminNotes({ roleInfo, user }: any) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', error: false });

  // Filters
  const [filterGrade, setFilterGrade] = useState<number | 'all'>('all');
  const [filterSubjectId, setFilterSubjectId] = useState('');

  // Form State
  const [subjectName, setSubjectName] = useState('');
  const [grade, setGrade] = useState(10);
  const [title, setTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const [subRes, notesRes] = await Promise.all([
        fetch('/api/admin/subjects').then(r => r.json()),
        fetch('/api/admin/notes').then(r => r.json()),
      ]);
      setSubjects(Array.isArray(subRes) ? subRes : []);
      setNotes(Array.isArray(notesRes) ? notesRes : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const saveNote = async () => {
    if (!title.trim()) {
      setMsg({ text: 'Please enter a note title', error: true });
      return;
    }
    const targetSub = subjectName.trim() || (subjects[0]?.name || 'Physics');

    setSaving(true);
    setMsg({ text: '', error: false });

    try {
      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_name: targetSub,
          title: title.trim(),
          file_url: fileUrl.trim() || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          content: fileUrl.trim() || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          grade: parseInt(String(grade)),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to save note');

      setMsg({ text: `✓ Note "${title.trim()}" published successfully!`, error: false });
      setTimeout(() => setMsg({ text: '', error: false }), 4000);

      setTitle(''); setFileUrl('');
      await fetch_();
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to save note', error: true });
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (id: number) => {
    if (!confirm('Delete this note?')) return;
    await fetch('/api/admin/notes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetch_();
  };

  const filteredNotes = notes.filter(n => {
    const matchGrade = filterGrade === 'all' || n.grade === filterGrade;
    const matchSubject = !filterSubjectId || n.subject_name?.toLowerCase().includes(filterSubjectId.toLowerCase());
    return matchGrade && matchSubject;
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><FileText size={24} className="text-teal-400" /> Notes & PDF Uploads</h1>
        <p className="text-slate-400 text-sm mt-0.5">Publish PDF chapter notes & formula cheat sheets directly to the student app.</p>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${msg.error ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
          {msg.error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />} {msg.text}
        </div>
      )}

      {/* Add New Note Box */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
        <h2 className="text-sm font-black text-white flex items-center gap-2"><Plus size={16} className="text-teal-400" /> Publish New Study Note</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-slate-300 font-bold block mb-1">Subject Name</label>
            <input type="text" placeholder="e.g. Physics, Chemistry, Accountancy" value={subjectName} onChange={e => setSubjectName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500" />
          </div>
          <div>
            <label className="text-slate-300 font-bold block mb-1">Grade Level</label>
            <select value={grade} onChange={e => setGrade(parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none">
              {[8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-300 font-bold block mb-1">Note Title</label>
            <input type="text" placeholder="e.g. Wave Optics Formula Cheat Sheet" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500" />
          </div>
        </div>

        <div>
          <label className="text-slate-300 font-bold block mb-1 text-xs">PDF / Document URL</label>
          <input type="text" placeholder="https://example.com/notes.pdf (Direct PDF link)" value={fileUrl} onChange={e => setFileUrl(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500" />
        </div>

        <button onClick={saveNote} disabled={saving} className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20 disabled:opacity-50">
          {saving ? 'Publishing...' : 'Publish Note'}
        </button>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-bold">
          <Filter size={14} /> Filter Notes:
        </div>
        <div className="flex gap-2">
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value === 'all' ? 'all' : parseInt(e.target.value))} className="bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-xl text-xs">
            <option value="all">All Grades</option>
            {[8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </div>
      </div>

      {loading ? <LoadingSpinner size="lg" text="Loading Notes…" /> : (
        <div className="space-y-2">
          {filteredNotes.map(n => (
            <div key={n.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs gap-3">
              <div>
                <p className="font-bold text-white text-sm">{n.title}</p>
                <p className="text-slate-400 mt-0.5">{n.subject_name} · Grade {n.grade}</p>
              </div>
              <button onClick={() => deleteNote(n.id)} className="text-slate-500 hover:text-red-400 p-1.5">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {filteredNotes.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">No notes found. Create your first note above!</div>
          )}
        </div>
      )}
    </div>
  );
}
