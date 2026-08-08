import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';
import { GRADES, STREAMS, SUBJECTS_BY_GRADE, SUBJECTS_BY_STREAM, PROVINCES, DISTRICTS_BY_PROVINCE } from '../lib/constants';

const steps = ['Grade', 'Stream', 'Subjects', 'School', 'Location'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, updateLocalProfile } = useAuth();

  // Pre-populate if profile exists
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [grade, setGrade] = useState<number | null>(profile?.grade || null);
  const [stream, setStream] = useState<string | null>(profile?.stream || null);
  const [subjects, setSubjects] = useState<string[]>(profile?.subjects || []);
  const [schoolSearch, setSchoolSearch] = useState(profile?.school_name || '');
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<any | null>(profile?.school_name ? { id: profile.school_id, name: profile.school_name } : null);
  const [province, setProvince] = useState(profile?.province || '');
  const [district, setDistrict] = useState(profile?.district || '');
  const [loading, setLoading] = useState(false);
  const [searchingSchools, setSearchingSchools] = useState(false);
  const [error, setError] = useState('');

  // Fetch school search suggestions
  useEffect(() => {
    if (schoolSearch.trim().length < 2) { setSchools([]); return; }
    setSearchingSchools(true);
    fetch(`/api/schools?q=${encodeURIComponent(schoolSearch.trim())}`)
      .then(r => r.json())
      .then(d => setSchools(Array.isArray(d) ? d : []))
      .catch(() => setSchools([]))
      .finally(() => setSearchingSchools(false));
  }, [schoolSearch]);

  const availableSubjects = grade
    ? (grade >= 11 && stream ? (SUBJECTS_BY_STREAM[stream] || []) : (SUBJECTS_BY_GRADE[grade] || []))
    : [];

  const toggleSubject = (s: string) => {
    setSubjects(prev => prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]);
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

    const profilePayload = {
      id: user.id,
      email: user.email || null,
      full_name: fullName.trim() || 'Student',
      grade: grade ? parseInt(String(grade)) : 10,
      stream: grade && grade >= 11 ? stream : null,
      subjects: subjects || [],
      school_id: selectedSchool?.id ? String(selectedSchool.id) : null,
      school_name: selectedSchool?.name || schoolSearch || null,
      district: district || null,
      province: province || null,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    };

    try {
      // Synchronously update local React state in AuthContext so OnboardingGate sees onboarding_complete = true immediately
      updateLocalProfile(profilePayload);

      // Save to Supabase (direct upsert + API)
      await supabase.from('users').upsert(profilePayload, { onConflict: 'id' });

      try {
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, ...profilePayload }),
        });
      } catch {}

      await refreshProfile();
      navigate('/home', { replace: true });
    } catch (err: any) {
      console.error('Onboarding save error:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  const goNext = () => {
    if (step === 0 && grade && grade < 11) setStep(2);
    else setStep(s => Math.min(steps.length - 1, s + 1));
    setDir(1);
  };

  const goBack = () => {
    if (step === 2 && grade && grade < 11) setStep(0);
    else setStep(s => Math.max(0, s - 1));
    setDir(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white flex flex-col justify-between p-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          {step > 0 ? (
            <button onClick={goBack} className="flex items-center gap-1 text-white/80 text-sm font-semibold">
              <ChevronLeft size={18} /> Back
            </button>
          ) : <div />}
          <span className="text-white/60 text-xs font-bold">PadhaiNepal</span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <motion.div className="h-full bg-amber-400 rounded-full" animate={{ width: `${((step + 1) / steps.length) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
        <p className="text-xs text-white/60 mt-1">Step {step + 1} of {steps.length}</p>
      </div>

      {/* Main step content */}
      <div className="flex-1 flex flex-col justify-center my-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: 'easeInOut' }}>

            {/* STEP 0: Grade & Name */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black mb-1">What's your name & grade?</h2>
                  <p className="text-white/70 text-sm">We'll customize your study plan for your grade.</p>
                </div>
                <div>
                  <label className="text-xs text-white/70 mb-1 block font-medium">Full Name</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Aarav Sharma"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/60" />
                </div>
                <div>
                  <label className="text-xs text-white/70 mb-1 block font-medium">Select Grade</label>
                  <div className="grid grid-cols-5 gap-2">
                    {GRADES.map(g => (
                      <motion.button key={g} whileTap={{ scale: 0.92 }} onClick={() => setGrade(g)}
                        className={`py-3.5 rounded-2xl font-black text-sm border transition-all ${grade === g ? 'bg-white text-blue-700 border-white shadow-lg' : 'bg-white/10 text-white border-white/20'}`}>
                        {g}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: Stream (11-12 only) */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black mb-1">Choose your stream</h2>
                  <p className="text-white/70 text-sm">Select your Grade {grade} stream in NEB.</p>
                </div>
                <div className="space-y-2.5">
                  {STREAMS.map(s => (
                    <motion.button key={s} whileTap={{ scale: 0.97 }} onClick={() => setStream(s)}
                      className={`w-full p-4 rounded-2xl text-left border font-bold text-sm flex items-center justify-between transition-all ${stream === s ? 'bg-white text-blue-700 border-white shadow-lg' : 'bg-white/10 text-white border-white/20'}`}>
                      <span>{s} Stream</span>
                      {stream === s && <Check size={18} />}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Subjects */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black mb-1">Select your subjects</h2>
                  <p className="text-white/70 text-sm">Tap all subjects you are currently studying.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {availableSubjects.map(s => {
                    const sel = subjects.includes(s);
                    return (
                      <motion.button key={s} whileTap={{ scale: 0.95 }} onClick={() => toggleSubject(s)}
                        className={`p-3.5 rounded-2xl text-left text-xs font-bold border transition-all flex items-center justify-between ${sel ? 'bg-white text-blue-700 border-white shadow-md' : 'bg-white/10 text-white border-white/20'}`}>
                        <span className="truncate">{s}</span>
                        {sel && <Check size={14} className="flex-shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>
                <p className="text-xs text-white/50">{subjects.length} subject{subjects.length !== 1 ? 's' : ''} selected</p>
              </div>
            )}

            {/* STEP 3: School */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black mb-1">Search your school</h2>
                  <p className="text-white/70 text-sm">Connect with classmates from your school (Optional).</p>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                  <input value={schoolSearch} onChange={e => { setSchoolSearch(e.target.value); setSelectedSchool(null); }} placeholder="Type school name..."
                    className="w-full bg-white/10 border border-white/20 rounded-2xl pl-10 pr-4 py-3.5 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/60" />
                </div>

                {searchingSchools && <p className="text-xs text-white/50">Searching schools in Nepal...</p>}

                {schools.length > 0 && (
                  <div className="bg-white/10 border border-white/20 rounded-2xl overflow-hidden max-h-40 overflow-y-auto divide-y divide-white/10">
                    {schools.map(s => (
                      <button key={s.id} onClick={() => { setSelectedSchool(s); setSchoolSearch(s.name); setSchools([]); }}
                        className={`w-full p-3 text-left text-xs hover:bg-white/20 flex items-center justify-between ${selectedSchool?.id === s.id ? 'bg-white/20 font-bold' : ''}`}>
                        <div>
                          <p className="text-white font-semibold">{s.name}</p>
                          <p className="text-white/50 text-[10px]">{s.district}, {s.province}</p>
                        </div>
                        {selectedSchool?.id === s.id && <Check size={14} className="text-amber-400" />}
                      </button>
                    ))}
                  </div>
                )}

                {selectedSchool && (
                  <div className="bg-white/20 border border-white/30 rounded-2xl p-3 flex items-center justify-between">
                    <span className="text-xs font-bold">🏫 {selectedSchool.name}</span>
                    <span className="text-xs text-amber-300">Selected ✓</span>
                  </div>
                )}
                <p className="text-xs text-white/50 italic">Tip: School selection is optional. You can skip if not found.</p>
              </div>
            )}

            {/* STEP 4: Location */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black mb-1">Where are you located?</h2>
                  <p className="text-white/70 text-sm">For district leaderboards and local study groups.</p>
                </div>
                <div>
                  <label className="text-xs text-white/70 mb-1 block font-medium">Province</label>
                  <select value={province} onChange={e => { setProvince(e.target.value); setDistrict(''); }}
                    className="w-full bg-slate-900/80 border border-white/20 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-white/60 appearance-none">
                    <option value="">Select Province</option>
                    {PROVINCES.map(p => <option key={p} value={p} className="bg-slate-900 text-white">{p}</option>)}
                  </select>
                </div>
                {province && (
                  <div>
                    <label className="text-xs text-white/70 mb-1 block font-medium">District</label>
                    <select value={district} onChange={e => setDistrict(e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/20 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-white/60 appearance-none">
                      <option value="">Select District</option>
                      {(DISTRICTS_BY_PROVINCE[province] || []).map(d => <option key={d} value={d} className="bg-slate-900 text-white">{d}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer / Error / Button */}
      <div className="space-y-2">
        {error && <p className="text-xs text-amber-300 font-bold text-center bg-amber-500/20 py-2 rounded-xl border border-amber-400/30">{error}</p>}
        <motion.button whileTap={{ scale: 0.97 }} onClick={step === steps.length - 1 ? handleFinish : goNext} disabled={!canNext() || loading}
          className="w-full bg-white text-blue-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-40 disabled:cursor-not-allowed">
          {loading
            ? <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
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
