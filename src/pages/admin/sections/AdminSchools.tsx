import { useState, useEffect } from 'react';
import { School, Check, X, Shield, Users, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function AdminSchools({ roleInfo, user }: any) {
  const [schools, setSchools] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [primaryId, setPrimaryId] = useState('');
  const [duplicateId, setDuplicateId] = useState('');
  const [merging, setMerging] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/schools');
      const data = await res.json();
      setSchools(data.schools || []);
      setClaims(data.claims || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const mergeSchools = async () => {
    if (!primaryId || !duplicateId || primaryId === duplicateId) return;
    setMerging(true);
    try {
      const res = await fetch('/api/admin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primary_school_id: primaryId, duplicate_school_id: duplicateId, admin_user_id: user?.id }),
      });
      if (res.ok) {
        alert('Schools merged successfully!');
        setPrimaryId(''); setDuplicateId('');
        fetch_();
      }
    } finally { setMerging(false); }
  };

  const handleClaim = async (claim_id: number, status: 'approved' | 'rejected') => {
    await fetch('/api/admin/schools', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim_id, status, admin_user_id: user?.id }),
    });
    fetch_();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><School size={24} className="text-cyan-400" /> School Management & Teacher Claims</h1>
        <p className="text-slate-400 text-sm mt-0.5">Approve teacher school-admin claims and merge duplicate school listings.</p>
      </div>

      {/* Claim Queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
        <h3 className="font-bold text-white text-base">Teacher School Claim Requests ({claims.filter(c => c.status === 'pending').length})</h3>
        {claims.length === 0 ? (
          <p className="text-slate-500 text-xs py-3 text-center">No pending claim requests right now.</p>
        ) : (
          <div className="space-y-2">
            {claims.map(c => (
              <div key={c.id} className="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white">{c.user_name} ({c.school_name})</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">Status: <span className="text-amber-400 uppercase font-bold">{c.status}</span></p>
                </div>
                {c.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleClaim(c.id, 'approved')} className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1">
                      <Check size={12} /> Approve
                    </button>
                    <button onClick={() => handleClaim(c.id, 'rejected')} className="bg-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1">
                      <X size={12} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Merge Tool */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <h3 className="font-bold text-white text-base">School Merge Tool</h3>
        <p className="text-slate-400 text-xs">Merge a duplicate school entry into a primary school. All student references reassign automatically.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Primary School (Keep this one)</label>
            <select value={primaryId} onChange={e => setPrimaryId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
              <option value="">Select primary school…</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name} ({s.district})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Duplicate School (Will be merged & deleted)</label>
            <select value={duplicateId} onChange={e => setDuplicateId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
              <option value="">Select duplicate school…</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name} ({s.district})</option>)}
            </select>
          </div>
        </div>

        <button onClick={mergeSchools} disabled={merging || !primaryId || !duplicateId || primaryId === duplicateId} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-2xl text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-40">
          {merging ? 'Merging Schools…' : 'Merge Schools Now'}
        </button>
      </div>
    </div>
  );
}
