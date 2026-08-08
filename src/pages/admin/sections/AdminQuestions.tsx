import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Plus, Trash2, Filter, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function AdminQuestions({ roleInfo }: any) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', error: false });

  // Form State
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAns, setCorrectAns] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [yearAsked, setYearAsked] = useState('2080');
  const [saving, setSaving] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/questions');
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQuestions(); }, []);

  const saveQuestion = async () => {
    if (!qText.trim()) {
      setMsg({ text: 'Please enter question text', error: true });
      return;
    }
    if (!optA.trim() || !optB.trim()) {
      setMsg({ text: 'Please enter at least Options A and B', error: true });
      return;
    }

    setSaving(true);
    setMsg({ text: '', error: false });

    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter_id: 1,
          question_text: qText.trim(),
          options: [optA.trim(), optB.trim(), optC.trim() || 'C', optD.trim() || 'D'],
          correct_answer: correctAns,
          explanation: explanation.trim(),
          difficulty,
          year_asked: yearAsked,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to save question');

      setMsg({ text: `✓ Question added successfully with ID #${data.id}!`, error: false });
      setTimeout(() => setMsg({ text: '', error: false }), 4000);

      setQText(''); setOptA(''); setOptB(''); setOptC(''); setOptD(''); setExplanation('');
      await fetchQuestions();
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to save question', error: true });
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm('Delete this question?')) return;
    await fetch('/api/admin/questions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchQuestions();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><HelpCircle size={24} className="text-emerald-400" /> MCQ Question Bank Manager</h1>
        <p className="text-slate-400 text-sm mt-0.5">Add chapter practice MCQs with options, correct answer keys & NEB board explanations.</p>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${msg.error ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
          {msg.error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />} {msg.text}
        </div>
      )}

      {/* Add Question Form */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
        <h2 className="text-sm font-black text-white flex items-center gap-2"><Plus size={16} className="text-emerald-400" /> Add New MCQ Question</h2>

        <div>
          <label className="text-slate-300 font-bold block mb-1 text-xs">Question Text</label>
          <textarea placeholder="Type the question here..." value={qText} onChange={e => setQText(e.target.value)} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-slate-300 font-bold block mb-1">Option A {correctAns === 0 && ' (Correct ✓)'}</label>
            <input type="text" placeholder="Option A" value={optA} onChange={e => setOptA(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-slate-300 font-bold block mb-1">Option B {correctAns === 1 && ' (Correct ✓)'}</label>
            <input type="text" placeholder="Option B" value={optB} onChange={e => setOptB(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-slate-300 font-bold block mb-1">Option C {correctAns === 2 && ' (Correct ✓)'}</label>
            <input type="text" placeholder="Option C" value={optC} onChange={e => setOptC(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-slate-300 font-bold block mb-1">Option D {correctAns === 3 && ' (Correct ✓)'}</label>
            <input type="text" placeholder="Option D" value={optD} onChange={e => setOptD(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-slate-300 font-bold block mb-1">Correct Answer</label>
            <select value={correctAns} onChange={e => setCorrectAns(parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none">
              <option value={0}>Option A</option>
              <option value={1}>Option B</option>
              <option value={2}>Option C</option>
              <option value={3}>Option D</option>
            </select>
          </div>
          <div>
            <label className="text-slate-300 font-bold block mb-1">Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="text-slate-300 font-bold block mb-1">Year Asked (NEB)</label>
            <input type="text" placeholder="e.g. 2080, 2079" value={yearAsked} onChange={e => setYearAsked(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="text-slate-300 font-bold block mb-1 text-xs">Explanation / Solution Tip</label>
          <input type="text" placeholder="Explanation for correct answer..." value={explanation} onChange={e => setExplanation(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
        </div>

        <button onClick={saveQuestion} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50">
          {saving ? 'Saving...' : 'Add Question'}
        </button>
      </div>

      {loading ? <LoadingSpinner size="lg" text="Loading Questions..." /> : (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">Question Bank ({questions.length})</h3>
          {questions.map(q => (
            <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs gap-3">
              <div>
                <p className="font-bold text-white text-sm">{q.question_text}</p>
                <p className="text-slate-400 mt-0.5">ID #{q.id} · Answer: Option {['A','B','C','D'][q.correct_answer || 0]} · Difficulty: {q.difficulty}</p>
              </div>
              <button onClick={() => deleteQuestion(q.id)} className="text-slate-500 hover:text-red-400 p-1.5">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
