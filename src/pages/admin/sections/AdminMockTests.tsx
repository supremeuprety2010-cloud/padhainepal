import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Eye, Play, Filter } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function AdminMockTests({ roleInfo }: any) {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterGrade, setFilterGrade] = useState<number | 'all'>(12);
  const [filterSubject, setFilterSubject] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [grade, setGrade] = useState(12);
  const [mode, setMode] = useState('full');
  const [qCount, setQCount] = useState(25);
  const [duration, setDuration] = useState(45);
  const [saving, setSaving] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/mock-tests');
      const data = await res.json();
      setTests(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const filteredTests = tests.filter(t => {
    const matchGrade = filterGrade === 'all' || t.grade === filterGrade;
    const matchSubject = !filterSubject || t.subject_name === filterSubject;
    return matchGrade && matchSubject;
  });

  const createTest = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/admin/mock-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subject_name: subject,
          grade,
          mode,
          duration_minutes: duration,
          question_count: qCount,
        }),
      });
      setTitle('');
      fetch_();
    } finally { setSaving(false); }
  };

  const deleteTest = async (id: number) => {
    if (!confirm('Delete mock test?')) return;
    await fetch('/api/admin/mock-tests', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetch_();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Target size={24} className="text-amber-400" /> Mock Test Builder</h1>
        <p className="text-slate-400 text-sm mt-0.5">Filter mock tests by Grade & Subject. Assemble chapter, unit, and full exam simulations for students.</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
          <Filter size={14} /> Filter Published Mock Tests
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Grade</label>
            <select value={filterGrade} onChange={e => {
              const v = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
              setFilterGrade(v);
            }} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
              <option value="all">All Grades</option>
              {[8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Subject</label>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
              <option value="">All Subjects</option>
              {['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Science', 'English', 'Accountancy'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <h3 className="font-bold text-white text-base">Create Mock Test</h3>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Test Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Grade 12 Physics Final Board Model Exam" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Subject</label>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Biology">Biology</option>
              <option value="Science">Science</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Grade</label>
            <select value={grade} onChange={e => setGrade(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
              {[8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Mode</label>
            <select value={mode} onChange={e => setMode(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
              <option value="chapter">Chapter Test</option>
              <option value="subject">Subject Test</option>
              <option value="full">Full Board Simulation</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Question Count</label>
            <input type="number" value={qCount} onChange={e => setQCount(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Duration (minutes)</label>
            <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white" />
          </div>
        </div>

        <button onClick={createTest} disabled={saving || !title.trim()} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-2xl text-xs shadow-lg shadow-amber-500/20 disabled:opacity-40">
          {saving ? 'Creating…' : 'Publish Mock Test'}
        </button>
      </div>

      {/* List */}
      {loading ? <LoadingSpinner size="lg" text="Loading tests…" /> : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Filtered Mock Tests ({filteredTests.length})</h3>
            <span className="text-xs text-slate-400">Grade: {filterGrade} · Subject: {filterSubject || 'All'}</span>
          </div>

          <div className="space-y-2">
            {filteredTests.map(t => (
              <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs hover:border-slate-700 transition-colors">
                <div>
                  <p className="font-bold text-white">{t.title}</p>
                  <p className="text-slate-400 mt-0.5">{t.subject_name} · Grade {t.grade} · {t.question_count} Qs · {t.duration_minutes} min</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => deleteTest(t.id)} className="p-2 text-slate-500 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {filteredTests.length === 0 && (
              <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-3xl">
                <Target size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm font-bold">No mock tests found for this filter</p>
                <p className="text-slate-500 text-xs mt-1">Try selecting a different Grade or Subject.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
