import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Trash2, X, GraduationCap, Layers } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function AdminSubjects({ roleInfo }: any) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>(10);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showChapModal, setShowChapModal] = useState<any>(null); // subject obj

  // Subject Form
  const [subName, setSubName] = useState('');
  const [subGrade, setSubGrade] = useState(10);
  const [subStream, setSubStream] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subIcon, setSubIcon] = useState('📚');
  const [savingSub, setSavingSub] = useState(false);

  // Chapter Form
  const [chapTitle, setChapTitle] = useState('');
  const [chapNumber, setChapNumber] = useState(1);
  const [chapDesc, setChapDesc] = useState('');
  const [savingChap, setSavingChap] = useState(false);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subjects');
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const filteredSubjects = selectedGrade === 'all'
    ? subjects
    : subjects.filter(s => s.grade === selectedGrade);

  const saveSubject = async () => {
    if (!subName.trim()) return;
    setSavingSub(true);
    try {
      await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subject', name: subName.trim(), grade: subGrade, stream: subStream || null, description: subDesc, icon: subIcon }),
      });
      setShowSubModal(false);
      setSubName(''); setSubDesc('');
      fetchSubjects();
    } finally { setSavingSub(false); }
  };

  const saveChapter = async () => {
    if (!chapTitle.trim() || !showChapModal) return;
    setSavingChap(true);
    try {
      await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chapter',
          name: chapTitle.trim(),
          grade: showChapModal.grade,
          subject_name: showChapModal.name,
          chapter_number: chapNumber,
          description: chapDesc,
        }),
      });
      setShowChapModal(null);
      setChapTitle(''); setChapDesc('');
      fetchSubjects();
    } finally { setSavingChap(false); }
  };

  const deleteSubject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    await fetch('/api/admin/subjects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'subject', id }) });
    fetchSubjects();
  };

  const deleteChapter = async (id: number) => {
    if (!confirm('Delete this chapter?')) return;
    await fetch('/api/admin/subjects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'chapter', id }) });
    fetchSubjects();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><BookOpen size={24} className="text-blue-400" /> Subjects & Chapters Hierarchy</h1>
          <p className="text-slate-400 text-sm mt-0.5">Filtered by Grade level. Manage curriculum structure (Grade → Subject → Chapters).</p>
        </div>
        <button onClick={() => setShowSubModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20 self-start sm:self-auto">
          <Plus size={16} /> Add Subject
        </button>
      </div>

      {/* Grade Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-slate-900 p-2 rounded-2xl border border-slate-800">
        <span className="text-xs font-bold text-slate-400 px-3 flex items-center gap-1">
          <GraduationCap size={14} /> Grade:
        </span>
        {([8, 9, 10, 11, 12, 'all'] as const).map(g => (
          <button
            key={String(g)}
            onClick={() => setSelectedGrade(g)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedGrade === g ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {g === 'all' ? 'All Grades' : `Grade ${g}`}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner size="lg" text="Loading curriculum tree…" /> : (
        <div className="space-y-4">
          {filteredSubjects.map((sub) => (
            <div key={sub.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sub.icon || '📚'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-white text-base">{sub.name}</h3>
                      <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">Grade {sub.grade}</span>
                      {sub.stream && <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-500/30">{sub.stream}</span>}
                      <span className="text-xs text-slate-500">({(sub.chapters || []).length} chapters)</span>
                    </div>
                    {sub.description && <p className="text-slate-400 text-xs mt-0.5">{sub.description}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => { setShowChapModal(sub); setChapNumber((sub.chapters?.length || 0) + 1); }} className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold px-3 py-1.5 rounded-xl text-xs border border-emerald-500/30 flex items-center gap-1 transition-all">
                    <Plus size={14} /> Add Chapter
                  </button>
                  <button onClick={() => deleteSubject(sub.id)} className="p-2 text-slate-500 hover:text-red-400 rounded-xl hover:bg-slate-800 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Chapters list */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                {(sub.chapters || []).map((ch: any) => (
                  <div key={ch.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[11px] flex-shrink-0">
                        {ch.chapter_number}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-200 truncate">{ch.title}</p>
                        {ch.description && <p className="text-slate-500 text-[11px] truncate">{ch.description}</p>}
                      </div>
                    </div>

                    <button onClick={() => deleteChapter(ch.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {(sub.chapters || []).length === 0 && <p className="text-slate-500 text-xs py-2 italic text-center">No chapters yet. Click "Add Chapter" above.</p>}
              </div>
            </div>
          ))}

          {filteredSubjects.length === 0 && (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-3xl">
              <BookOpen size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm font-bold">No subjects found for Grade {selectedGrade}</p>
              <p className="text-slate-500 text-xs mt-1">Click "Add Subject" to create one.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Subject Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-white text-base">New Subject</h3>
              <button onClick={() => setShowSubModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Subject Name</label>
              <input value={subName} onChange={e => setSubName(e.target.value)} placeholder="e.g. Physics" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Grade</label>
                <select value={subGrade} onChange={e => setSubGrade(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                  {[8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Stream</label>
                <select value={subStream} onChange={e => setSubStream(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                  <option value="">Compulsory / None</option>
                  <option value="Science">Science</option>
                  <option value="Management">Management</option>
                  <option value="Humanities">Humanities</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Description</label>
              <input value={subDesc} onChange={e => setSubDesc(e.target.value)} placeholder="Brief overview" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowSubModal(false)} className="flex-1 bg-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs">Cancel</button>
              <button onClick={saveSubject} disabled={savingSub || !subName.trim()} className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-blue-500/20">
                {savingSub ? 'Saving…' : 'Create Subject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Chapter Modal */}
      {showChapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-white text-base">Add Chapter to {showChapModal.name}</h3>
              <button onClick={() => setShowChapModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Chapter Title</label>
              <input value={chapTitle} onChange={e => setChapTitle(e.target.value)} placeholder="e.g. Kinematics" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Chapter Number</label>
              <input type="number" min={1} value={chapNumber} onChange={e => setChapNumber(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Description</label>
              <input value={chapDesc} onChange={e => setChapDesc(e.target.value)} placeholder="Overview of topics" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowChapModal(null)} className="flex-1 bg-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs">Cancel</button>
              <button onClick={saveChapter} disabled={savingChap || !chapTitle.trim()} className="flex-1 bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20">
                {savingChap ? 'Saving…' : 'Add Chapter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
