import { useState, useEffect } from 'react';
import { HelpCircle, Plus, Upload, Trash2, FileSpreadsheet, Check, AlertCircle, Search, Filter } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function AdminQuestions({ roleInfo }: any) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'list'>('single');

  // Filter Bar State
  const [filterGrade, setFilterGrade] = useState<number | 'all'>(10);
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterChapter, setFilterChapter] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Single Question Form
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAns, setCorrectAns] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [yearAsked, setYearAsked] = useState('');
  const [saving, setSaving] = useState(false);

  // Bulk CSV state
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const [subRes, qRes] = await Promise.all([
        fetch('/api/admin/subjects').then(r => r.json()),
        fetch('/api/admin/questions?limit=500').then(r => r.json()),
      ]);
      setSubjects(Array.isArray(subRes) ? subRes : []);
      setQuestions(Array.isArray(qRes) ? qRes : []);
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

  // Filtered Questions List
  const filteredQuestions = questions.filter(q => {
    const matchGrade = filterGrade === 'all' || subjects.find(s => (s.chapters || []).some((c: any) => c.id === q.chapter_id))?.grade === filterGrade;
    const matchSubject = !selectedFilterSub || subjects.find(s => (s.chapters || []).some((c: any) => c.id === q.chapter_id))?.id === selectedFilterSub.id;
    const matchChapter = !filterChapter || String(q.chapter_id) === String(filterChapter);
    const matchDiff = !filterDifficulty || q.difficulty === filterDifficulty;
    const matchSearch = !searchQuery || q.question_text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGrade && matchSubject && matchChapter && matchDiff && matchSearch;
  });

  const saveSingleQuestion = async () => {
    if (!qText.trim() || !optA || !optB || !optC || !optD || !selectedChapter) return;
    setSaving(true);
    try {
      await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter_id: selectedChapter,
          question_text: qText.trim(),
          options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()],
          correct_answer: correctAns,
          explanation,
          difficulty,
          year_asked: yearAsked || null,
        }),
      });
      setQText(''); setOptA(''); setOptB(''); setOptC(''); setOptD(''); setExplanation('');
      fetch_();
    } finally { setSaving(false); }
  };

  // Parse CSV
  const parseCSV = (raw: string) => {
    setCsvText(raw);
    const lines = raw.split('\n').map((l: string) => l.trim()).filter(Boolean);
    if (lines.length < 2) { setCsvPreview([]); return; }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c: string) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 5) {
        rows.push({
          question: cols[0],
          option_a: cols[1],
          option_b: cols[2],
          option_c: cols[3],
          option_d: cols[4],
          correct_answer: cols[5] || 'a',
          explanation: cols[6] || '',
          year: cols[7] || '',
        });
      }
    }
    setCsvPreview(rows);
  };

  const processBulkImport = async () => {
    if (!csvPreview.length) return;
    setImporting(true);
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_bulk: true,
          csv_rows: csvPreview,
          chapter_id: selectedChapter || 1,
        }),
      });
      const data = await res.json();
      if (data.count) {
        alert(`Successfully imported ${data.count} MCQs!`);
        setCsvText(''); setCsvPreview([]);
        fetch_();
      }
    } finally { setImporting(false); }
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm('Soft-delete this question?')) return;
    await fetch('/api/admin/questions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetch_();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><HelpCircle size={24} className="text-emerald-400" /> MCQ Question Bank</h1>
        <p className="text-slate-400 text-sm mt-0.5">Filter questions by Grade & Chapter. Add individual MCQs or bulk-import via CSV template.</p>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
          <Filter size={14} /> Filter Question Bank
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
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

          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Difficulty</label>
            <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900 rounded-2xl p-1 gap-1 border border-slate-800">
        <button onClick={() => setActiveTab('single')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'single' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>
          ➕ Single Question
        </button>
        <button onClick={() => setActiveTab('bulk')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'bulk' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>
          📥 Bulk CSV Import
        </button>
        <button onClick={() => setActiveTab('list')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'list' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>
          📋 Filtered MCQs ({filteredQuestions.length})
        </button>
      </div>

      {/* SINGLE FORM */}
      {activeTab === 'single' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
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
            <label className="text-xs text-slate-400 mb-1 block">Question Text</label>
            <textarea value={qText} onChange={e => setQText(e.target.value)} placeholder="Type question text..." rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-400 mb-1 block">Option A</label><input value={optA} onChange={e => setOptA(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 mb-1 block">Option B</label><input value={optB} onChange={e => setOptB(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 mb-1 block">Option C</label><input value={optC} onChange={e => setOptC(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 mb-1 block">Option D</label><input value={optD} onChange={e => setOptD(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white" /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Correct Answer</label>
              <select value={correctAns} onChange={e => setCorrectAns(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
                <option value={0}>Option A</option>
                <option value={1}>Option B</option>
                <option value={2}>Option C</option>
                <option value={3}>Option D</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Year Asked (Optional)</label>
              <input value={yearAsked} onChange={e => setYearAsked(e.target.value)} placeholder="e.g. 2023" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Explanation</label>
            <input value={explanation} onChange={e => setExplanation(e.target.value)} placeholder="Step-by-step solution" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white" />
          </div>

          <button onClick={saveSingleQuestion} disabled={saving || !qText.trim() || !selectedChapter} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-2xl text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-40">
            {saving ? 'Saving Question…' : 'Save Question to Bank'}
          </button>
        </div>
      )}

      {/* BULK CSV */}
      {activeTab === 'bulk' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2"><FileSpreadsheet size={18} className="text-emerald-400" /> Bulk CSV MCQ Importer</h3>
            <button onClick={() => {
              const csvTemplate = `question,option_a,option_b,option_c,option_d,correct_answer,explanation,year\n"What is the SI unit of Force?","Newton","Joule","Watt","Pascal","a","Force = mass x acceleration","2023"`;
              const blob = new Blob([csvTemplate], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'mcq_import_template.csv'; a.click();
            }} className="text-xs font-bold text-emerald-400 hover:underline">Download CSV Template</button>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Paste CSV Data or Drag & Drop CSV File</label>
            <textarea value={csvText} onChange={e => parseCSV(e.target.value)} placeholder={`question,option_a,option_b,option_c,option_d,correct_answer,explanation,year\n"What is 2+2?","3","4","5","6","b","Basic addition","2023"`} rows={6} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500" />
          </div>

          {csvPreview.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-emerald-400">✅ {csvPreview.length} questions ready to import</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {csvPreview.slice(0, 5).map((r, i) => (
                  <div key={i} className="bg-slate-950 p-2 rounded-xl text-[11px] text-slate-300 flex justify-between">
                    <span className="truncate flex-1">{i + 1}. {r.question}</span>
                    <span className="text-emerald-400 font-bold ml-2">Ans: {r.correct_answer}</span>
                  </div>
                ))}
              </div>
              <button onClick={processBulkImport} disabled={importing} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-2xl text-xs shadow-lg shadow-emerald-500/20">
                {importing ? 'Importing Rows…' : `Commit ${csvPreview.length} MCQs to Database`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* LIST */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Filtered Questions ({filteredQuestions.length})</h3>
            <span className="text-xs text-slate-400">Grade: {filterGrade} · Subject: {selectedFilterSub?.name || 'All'}</span>
          </div>

          {filteredQuestions.map(q => (
            <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-white leading-relaxed flex-1">{q.question_text}</p>
                <button onClick={() => deleteQuestion(q.id)} className="p-1.5 text-slate-500 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                {(q.options || []).map((opt: string, idx: number) => (
                  <span key={idx} className={idx === q.correct_answer ? 'text-emerald-400 font-bold' : ''}>
                    {String.fromCharCode(65 + idx)}. {opt} {idx === q.correct_answer && '✓'}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-3xl">
              <HelpCircle size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm font-bold">No questions found for this filter</p>
              <p className="text-slate-500 text-xs mt-1">Try selecting a different Grade, Subject or Chapter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
