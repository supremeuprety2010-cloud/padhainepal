import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GRADES, STREAMS, SUBJECTS_BY_GRADE, SUBJECTS_BY_STREAM, PROVINCES, DISTRICTS_BY_PROVINCE } from '../lib/constants';

const steps = ['Grade', 'Stream', 'Subjects', 'School', 'Location'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  // Pre-populate from existing profile if re-visiting
  const [step, setStep] = useState(0);
  const [grade, setGrade] = useState<number | null>(profile?.grade || null);
  const [stream, setStream] = useState<string | null>(profile?.stream || null);
  const [subjects, setSubjects] = useState<string[]>(profile?.subjects || []);
  const [schoolSearch, setSchoolSearch] = useState(profile?.school_name || '');
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<any | null>(
    profile?.school_name ? { name: profile.school_name, id: profile.school_id } : null
  );
  const [province, setProvince] = useState(profile?.province || '');
  const [district, setDistrict] = useState(profile?.district || '');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dir, setDir] = useState(1);

  const availableSubjects = grade
    ? (grade >= 11 && stream ? SUBJECTS_BY_STREAM[stream] : SUBJECTS_BY_GRADE[grade])
    : [];

  useEffect(() => {
    if (schoolSearch.length >= 2) {
      fetch(`/api/schools?q=${encodeURIComponent(schoolSearch)}`)
        .then(r => r.json()).then(setSchools).catch(() => setSchools([]));
    } else {
      setSchools([]);
    }
  }, [schoolSearch]);

  const toggleSubject = (s: string) => {
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  // Step validation — school is optional (skip allowed)
  const canNext = () => {
    if (step === 0) return grade !== null && fullName.trim().length >= 2;
    if (step === 1) return grade && grade < 11 ? true : stream !== null;
    if (step === 2) return subjects.length >= 1;
    if (step === 3) return true; // school is optional — always allow next
    if (step === 4) return province !== '' && district !== '';
    return false;
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          full_name: fullName,
          grade,
          stream: grade && grade >= 11 ? stream : null,
          subjects,
          school_id: selectedSchool?.id || null,
          school_name: selectedSchool?.name || schoolSearch || null,
          district,
          province,
        }),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      await refreshProfile();
      navigate('/home', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  const goNext = () => { setDir(1); setStep(s => s + 1); };
  const goBack = () => { setDir(-1); setStep(s => s - 1); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-2 mb-2">
          {step > 0 && (
            <button onClick={goBack} className="p-2 rounded-xl bg-white/60 backdrop-blur mr-1">
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="flex-1 flex gap-1.5">
            {steps.map((s, i) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">Step {step + 1} of {steps.length}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}>

            {/* Step 0 — Grade + Name */}
            {step === 0 && (
              <div>
                <h2 className="text-2xl font-black text-gray-800 mb-1">Welcome! 👋</h2>
                <p className="text-gray-500 text-sm mb-6">Let's set up your learning profile</p>
                <div className="mb-5">
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">Your full name</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Aarav Sharma"
                    className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-800 focus:outline-none focus:border-blue-400 shadow-sm" />
                </div>
                <label className="text-sm font-semibold text-gray-600 mb-3 block">Select your grade</label>
                <div className="grid grid-cols-5 gap-2">
                  {GRADES.map(g => (
                    <motion.button key={g} whileTap={{ scale: 0.9 }}
                      onClick={() => { setGrade(g); setSubjects([]); setStream(null); }}
                      className={`py-4 rounded-2xl font-bold text-lg transition-all ${grade === g ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-700 border border-gray-200'}`}>
                      {g}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1 — Stream */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-black text-gray-800 mb-1">Your Stream</h2>
                <p className="text-gray-500 text-sm mb-6">
                  {grade && grade < 11 ? 'No stream selection needed for Grade 8–10' : 'Choose your faculty for Grade 11–12'}
                </p>
                {grade && grade < 11 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-700 text-sm">
                    ✅ Grade {grade} doesn't require stream selection. Click Next to continue.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {STREAMS.map(s => (
                      <motion.button key={s} whileTap={{ scale: 0.97 }} onClick={() => setStream(s)}
                        className={`w-full py-4 px-5 rounded-2xl font-semibold text-left transition-all flex items-center justify-between ${stream === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-700 border border-gray-200'}`}>
                        <span>{s === 'Science' ? '🔬' : s === 'Management' ? '📊' : '📚'} {s}</span>
                        {stream === s && <Check size={18} />}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Subjects */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-black text-gray-800 mb-1">Your Subjects</h2>
                <p className="text-gray-500 text-sm mb-6">Select subjects you want to study ({subjects.length} selected)</p>
                <div className="grid grid-cols-2 gap-2">
                  {availableSubjects.map(s => (
                    <motion.button key={s} whileTap={{ scale: 0.95 }} onClick={() => toggleSubject(s)}
                      className={`py-3 px-3 rounded-2xl font-medium text-sm text-left transition-all flex items-center gap-2 ${subjects.includes(s) ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-gray-700 border border-gray-200'}`}>
                      {subjects.includes(s) && <Check size={14} />}
                      <span>{s}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — School (optional) */}
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-black text-gray-800 mb-1">Your School</h2>
                <p className="text-gray-500 text-sm mb-2">Search and select your school</p>
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
                  💡 School is optional — you can skip this step and add it later from your profile.
                </p>
                <div className="relative mb-3">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={schoolSearch} onChange={e => setSchoolSearch(e.target.value)}
                    placeholder="Search school name..."
                    className="w-full bg-white border border-gray-200 rounded-2xl pl-9 pr-4 py-3.5 text-gray-800 text-sm focus:outline-none focus:border-blue-400 shadow-sm" />
                </div>
                {selectedSchool && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-blue-800 text-sm">{selectedSchool.name}</p>
                      {selectedSchool.district && <p className="text-blue-600 text-xs">{selectedSchool.district}</p>}
                    </div>
                    <button onClick={() => { setSelectedSchool(null); setSchoolSearch(''); }} className="text-blue-400 text-xs">Change</button>
                  </div>
                )}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {schools.map((school: any) => (
                    <motion.button key={school.id} whileTap={{ scale: 0.97 }}
                      onClick={() => { setSelectedSchool(school); setSchools([]); setSchoolSearch(school.name); }}
                      className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-left hover:border-blue-300 transition-all">
                      <p className="font-semibold text-gray-800 text-sm">{school.name}</p>
                      <p className="text-gray-500 text-xs">{school.district} · {school.type}</p>
                    </motion.button>
                  ))}
                  {schoolSearch.length >= 2 && schools.length === 0 && !selectedSchool && (
                    <p className="text-center text-gray-400 text-sm py-4">No schools found. You can still continue.</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4 — Location */}
            {step === 4 && (
              <div>
                <h2 className="text-2xl font-black text-gray-800 mb-1">Your Location</h2>
                <p className="text-gray-500 text-sm mb-6">Helps us show local leaderboards</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">Province</label>
                    <select value={province} onChange={e => { setProvince(e.target.value); setDistrict(''); }}
                      className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-800 text-sm focus:outline-none focus:border-blue-400 appearance-none">
                      <option value="">Select province...</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  {province && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-2 block">District</label>
                      <select value={district} onChange={e => setDistrict(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-800 text-sm focus:outline-none focus:border-blue-400 appearance-none">
                        <option value="">Select district...</option>
                        {DISTRICTS_BY_PROVINCE[province]?.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 pt-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2 mb-3">{error}</div>
        )}
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={step === steps.length - 1 ? handleFinish : goNext}
          disabled={!canNext() || loading}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-40 disabled:cursor-not-allowed">
          {loading
            ? <div className="w-5 h-5 border-2 border-blue-200 border-t-white rounded-full animate-spin" />
            : <>
                <span>{step === steps.length - 1 ? '🚀 Start Learning!' : step === 3 ? (selectedSchool ? 'Continue' : 'Skip') : 'Continue'}</span>
                {step < steps.length - 1 && <ChevronRight size={18} />}
              </>
          }
        </motion.button>
      </div>
    </div>
  );
}
