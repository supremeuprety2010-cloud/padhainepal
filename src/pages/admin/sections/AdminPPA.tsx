import { useState, useEffect } from 'react';
import { BarChart3, Plus, Trash2, FileSpreadsheet } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function AdminPPA({ roleInfo }: any) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('Physics');
  const [chapter, setChapter] = useState('');
  const [year, setYear] = useState(2023);
  const [count, setCount] = useState(3);
  const [weightage, setWeightage] = useState(12);
  const [saving, setSaving] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ppa');
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const saveRecord = async () => {
    if (!chapter.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/admin/ppa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_name: subject,
          chapter_title: chapter.trim(),
          year_asked: year,
          question_count: count,
          weightage_pct: weightage,
        }),
      });
      setChapter('');
      fetch_();
    } finally { setSaving(false); }
  };

  const deleteRecord = async (id: number) => {
    if (!confirm('Delete record?')) return;
    await fetch('/api/admin/ppa', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetch_();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><BarChart3 size={24} className="text-purple-400" /> Past Paper Analysis Data</h1>
        <p className="text-slate-400 text-sm mt-0.5">Feeds historical question frequency and weightage charts on student side.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <h3 className="font-bold text-white text-base">Add Weightage Record</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Chapter Title</label>
            <input value={chapter} onChange={e => setChapter(e.target.value)} placeholder="e.g. Wave Optics" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Exam Year</label>
            <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Question Count</label>
            <input type="number" value={count} onChange={e => setCount(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Weightage %</label>
            <input type="number" value={weightage} onChange={e => setWeightage(parseFloat(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white" />
          </div>
        </div>

        <button onClick={saveRecord} disabled={saving || !chapter.trim()} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-2xl text-xs shadow-lg shadow-purple-500/20">
          {saving ? 'Saving…' : 'Save Past Paper Record'}
        </button>
      </div>

      {/* List */}
      {loading ? <LoadingSpinner size="lg" text="Loading records…" /> : (
        <div className="space-y-2">
          <h3 className="font-bold text-white text-sm">Past Paper Records ({records.length})</h3>
          {records.map(r => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white">{r.chapter_title} ({r.subject_name})</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Year: {r.year_asked} · {r.question_count} Qs · {r.weightage_pct}% Weightage</p>
              </div>
              <button onClick={() => deleteRecord(r.id)} className="p-1.5 text-slate-500 hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
