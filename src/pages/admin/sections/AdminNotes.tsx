import { useState, useEffect } from 'react';
import { FileText, Upload, Trash2, ExternalLink, Filter, GraduationCap, Eye } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function AdminNotes({ roleInfo, user }: any) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterGrade, setFilterGrade] = useState<number | 'all'>(10);
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterChapter, setFilterChapter] = useState('');

  // Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [title, setTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
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

  // Filtered Subjects for Dropdowns based on Grade
  const filteredSubjectsForGrade = filterGrade === 'all'
    ? subjects
    : subjects.filter(s => s.grade === filterGrade);

  // Get selected objects by unique subject ID
  const selectedUploadSub = subjects.find(s => String(s.id) === String(selectedSubjectId));
  const chaptersForUpload = selectedUploadSub?.chapters || [];

  const selectedFilterSub = subjects.find(s => String(s.id) === String(filterSubjectId));
  const chaptersForFilter = selectedFilterSub?.chapters || [];

  // Filter Notes List
  const filteredNotes = notes.filter(n => {
    const matchGrade = filterGrade === 'all' || n.grade === filterGrade || subjects.find(s => s.name === n.subject_name)?.grade === filterGrade;
    const matchSubject = !selectedFilterSub || n.subject_name === selectedFilterSub.name;
    const matchChapter = !filterChapter || String(n.chapter_id) === String(filterChapter);
    return matchGrade && matchSubject && matchChapter;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await fetch('/api/profile/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, file_base64: base64, file_name: file.name, content_type: file.type }),
        });
        const data = await res.json();
        if (data.url) setFileUrl(data.url);
      };
      reader.readAsDataURL(file);
    } finally { setUploading(false); }
  };

  const saveNote = async () => {
    if (!title.trim() || !selectedUploadSub) return;
    setSaving(true);
    try {
      await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter_id: selectedChapter || null,
          subject_name: selectedUploadSub.name,
          title: title.trim(),
          file_url: fileUrl || 'https://moecdc.gov.np',
          grade: selectedUploadSub.grade || 10,
          uploaded_by: user?.id,
        }),
      });
      setTitle(''); setFileUrl('');
      fetch_();
    } finally { setSaving(false); }
  };

  const deleteNote = async (id: number) => {
    if (!confirm('Delete this note?')) return;
    await fetch('/api/admin/notes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetch_();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><FileText size={24} className="text-teal-400" /> Notes & PDF Uploads</h1>
        <p className="text-slate-400 text-sm mt-0.5">Filter by Grade & Chapter. Upload PDF study materials directly to Supabase Storage.</p>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
          <Filter size={14} /> Filter Published Notes
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

      {/* Upload Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2"><Upload size={18} className="text-teal-400" /> Upload New Chapter Note / PDF</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Select Subject</label>
            <select value={selectedSubjectId} onChange={e => { setSelectedSubjectId(e.target.value); setSelectedChapter(''); }} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
              <option value="">Select subject…</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} (Grade {s.grade})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Select Chapter ({chaptersForUpload.length})</label>
            <select value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
              <option value="">Select chapter ({chaptersForUpload.length})…</option>
              {chaptersForUpload.map((c: any) => <option key={c.id} value={c.id}>{c.chapter_number}. {c.title}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Note Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Unit 1 Complete Theory & Derivations" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500" />
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">PDF / Document File Upload</label>
          <div className="flex gap-2">
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" id="admin-pdf-input" />
            <label htmlFor="admin-pdf-input" className="flex-1 bg-slate-950 border border-dashed border-slate-800 hover:border-teal-500 rounded-xl p-3 text-center cursor-pointer text-xs text-slate-400 hover:text-white transition-colors">
              {uploading ? 'Uploading to Supabase Storage…' : fileUrl ? `✅ File Attached: ${fileUrl.substring(0, 40)}…` : 'Click to select PDF file'}
            </label>
          </div>
        </div>

        <button onClick={saveNote} disabled={saving || !title.trim() || !selectedSubjectId} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-2xl text-xs shadow-lg shadow-teal-500/20 disabled:opacity-40 transition-colors">
          {saving ? 'Saving Note…' : 'Publish Note to Student App'}
        </button>
      </div>

      {/* List */}
      {loading ? <LoadingSpinner size="lg" text="Loading notes…" /> : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Filtered Notes ({filteredNotes.length})</h3>
            <span className="text-xs text-slate-400">Grade: {filterGrade} · Subject: {selectedFilterSub?.name || 'All'}</span>
          </div>

          <div className="space-y-2">
            {filteredNotes.map(n => (
              <div key={n.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-teal-500/20 text-teal-300 rounded-xl flex items-center justify-center font-bold">PDF</div>
                  <div>
                    <p className="font-bold text-white">{n.title}</p>
                    <p className="text-slate-400 mt-0.5">{n.subject_name} · Grade {n.grade || 10}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => deleteNote(n.id)} className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {filteredNotes.length === 0 && (
              <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-3xl">
                <FileText size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm font-bold">No notes found for this filter</p>
                <p className="text-slate-500 text-xs mt-1">Try selecting a different Grade, Subject or Chapter.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
