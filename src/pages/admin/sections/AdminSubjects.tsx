import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Trash2, X, GraduationCap, Layers, Check, ShieldAlert, Sparkles, Hash, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

const EMOJIS = ['📐', '🧪', '⚛️', '🧬', '📚', '🇳🇵', '💼', '💻', '⚖️', '🎨', '🌐', '📊'];

export default function AdminSubjects({ roleInfo }: any) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [showSubModal, setShowSubModal] = useState(false);
  const [showChapModal, setShowChapModal] = useState<any>(null); // subject obj
  const [successMsg, setSuccessMsg] = useState('');

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
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subject',
          name: subName.trim(),
          grade: subGrade,
          stream: subStream || null,
          description: subDesc.trim(),
          icon: subIcon,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to create subject');
      }

      if (data && data.id) {
        // Immediately add newly created subject to top of state with its generated ID
        setSubjects(prev => [data, ...prev]);
        setSelectedGrade('all'); // Ensure newly created subject is visible
        setSuccessMsg(`✓ Subject "${data.name}" created successfully with ID #${data.id}!`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }

      setShowSubModal(false);
      setSubName(''); setSubDesc('');
      await fetchSubjects();
    } catch (e: any) {
      console.error('Save Subject error:', e);
      alert(e.message || 'Failed to save subject. Please try again.');
    } finally { setSavingSub(false); }
  };

  const saveChapter = async () => {
    if (!chapTitle.trim() || !showChapModal) return;
    setSavingChap(true);
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chapter',
          name: chapTitle.trim(),
          grade: showChapModal.grade,
          subject_name: showChapModal.name,
          chapter_number: chapNumber,
          description: chapDesc.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to save chapter');

      setSuccessMsg(`✓ Chapter "${chapTitle}" added to ${showChapModal.name}!`);
      setTimeout(() => setSuccessMsg(''), 4000);

      setShowChapModal(null);
      setChapTitle(''); setChapDesc('');
      await fetchSubjects();
    } catch (e: any) {
      console.error('Save Chapter error:', e);
      alert(e.message || 'Failed to save chapter.');
    } finally { setSavingChap(false); }
  };

  const deleteSubject = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" (ID #${id})?`)) return;
    await fetch('/api/admin/subjects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'subject', id }) });
    setSubjects(prev => prev.filter(s => s.id !== id));
    fetchSubjects();
  };

  const deleteChapter = async (id: number) => {
    if (!confirm('Delete this chapter?')) return;
    await fetch('/api/admin/subjects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'chapter', id }) });
    fetchSubjects();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><BookOpen size={24} className="text-blue-400" /> Subjects & Curriculum Manager</h1>
          <p className="text-slate-400 text-sm mt-0.5">Create subjects with auto-generated IDs. Newly added subjects appear in student onboarding & hubs.</p>
        </div>
        <button onClick={() => setShowSubModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20 self-start sm:self-auto transition-all hover:scale-105">
          <Plus size={18} /> Add Subject
        </button>
      </div>

      {/* Success Notification Alert */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs px-4 py-3 rounded-2xl flex items-center justify-between shadow-lg">
            <span className="flex items-center gap-2"><CheckCircle2 size={16} /> {successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grade Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-slate-900 p-2 rounded-2xl border border-slate-800">
        <span className="text-xs font-bold text-slate-400 px-3 flex items-center gap-1">
          <GraduationCap size={14} /> Filter Grade:
        </span>
        {(['all', 8, 9, 10, 11, 12] as const).map(g => (
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

      {loading ? <LoadingSpinner size="lg" text="Loading Subjects & IDs..." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSubjects.map(sub => (
            <motion.div key={sub.id || sub.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between transition-all">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2.5 bg-slate-800 rounded-2xl border border-slate-700/50 flex-shrink-0">{sub.icon || '📚'}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-white text-base">{sub.name}</h3>
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                          <Hash size={10} /> ID #{sub.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">Grade {sub.grade} {sub.stream ? `· ${sub.stream}` : ''}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteSubject(sub.id, sub.name)} className="text-slate-500 hover:text-red-400 p-1.5 rounded-xl hover:bg-red-500/10 transition-colors" title="Delete subject">
                    <Trash2 size={16} />
                  </button>
                </div>

                {sub.description && <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">{sub.description}</p>}

                {/* Chapter List */}
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5"><Layers size={13} className="text-amber-400" /> Chapters ({sub.chapters?.length || 0})</span>
                    <button onClick={() => { setShowChapModal(sub); setChapNumber((sub.chapters?.length || 0) + 1); }} className="text-blue-400 hover:underline flex items-center gap-1">
                      <Plus size={12} /> Add Chapter
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(sub.chapters || []).map((ch: any) => (
                      <div key={ch.id || ch.title} className="flex items-center justify-between bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2 text-xs">
                        <span className="font-semibold text-slate-200">{ch.chapter_number || '•'}. {ch.title}</span>
                        <button onClick={() => deleteChapter(ch.id)} className="text-slate-500 hover:text-red-400 p-1">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {(!sub.chapters || sub.chapters.length === 0) && (
                      <p className="text-slate-500 text-xs italic py-2">No chapters added yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredSubjects.length === 0 && (
            <div className="col-span-full text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl">
              <BookOpen size={48} className="mx-auto mb-2 text-slate-600" />
              <p className="font-bold text-slate-300">No subjects found for Grade {selectedGrade}</p>
              <p className="text-slate-500 text-xs mt-1">Click "Add Subject" above to create CDC curriculum subjects.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Subject Modal */}
      <AnimatePresence>
        {showSubModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center gap-2"><BookOpen size={18} className="text-blue-400" /> Add New Subject</h3>
                <button onClick={() => setShowSubModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Subject Name (CDC / NEB)</label>
                  <input type="text" placeholder="e.g. Computer Science, Economics, Accountancy" value={subName} onChange={e => setSubName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Grade Level</label>
                    <select value={subGrade} onChange={e => setSubGrade(parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none">
                      {[8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Grade {g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Stream (Grades 11-12)</label>
                    <select value={subStream} onChange={e => setSubStream(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none">
                      <option value="">General / All</option>
                      <option value="Science">Science</option>
                      <option value="Management">Management</option>
                      <option value="Humanities">Humanities</option>
                      <option value="Education">Education</option>
                      <option value="Law">Law</option>
                    </select>
                  </div>
                </div>

                {/* Emoji Icon */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Subject Emoji Icon</label>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {EMOJIS.map(e => (
                      <button key={e} type="button" onClick={() => setSubIcon(e)} className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${subIcon === e ? 'bg-blue-600 border-2 border-white' : 'bg-slate-800 border border-slate-700'}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Description / Syllabus Summary</label>
                  <textarea placeholder="Brief subject syllabus description..." value={subDesc} onChange={e => setSubDesc(e.target.value)} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowSubModal(false)} className="flex-1 bg-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs">Cancel</button>
                <button onClick={saveSubject} disabled={savingSub} className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-lg shadow-blue-500/20">
                  {savingSub ? 'Creating…' : 'Create Subject'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Chapter Modal */}
      <AnimatePresence>
        {showChapModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center gap-2"><Layers size={18} className="text-amber-400" /> Add Chapter to {showChapModal.name}</h3>
                <button onClick={() => setShowChapModal(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-1">
                    <label className="text-slate-300 font-bold block mb-1">Ch. No.</label>
                    <input type="number" value={chapNumber} onChange={e => setChapNumber(parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-center font-bold" />
                  </div>
                  <div className="col-span-3">
                    <label className="text-slate-300 font-bold block mb-1">Chapter Title</label>
                    <input type="text" placeholder="e.g. Wave Optics, Vectors, Mensuration" value={chapTitle} onChange={e => setChapTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Chapter Key Topics / Description</label>
                  <textarea placeholder="Key concepts covered in this chapter..." value={chapDesc} onChange={e => setChapDesc(e.target.value)} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowChapModal(null)} className="flex-1 bg-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs">Cancel</button>
                <button onClick={saveChapter} disabled={savingChap} className="flex-1 bg-amber-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1">
                  {savingChap ? 'Saving…' : 'Add Chapter'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
