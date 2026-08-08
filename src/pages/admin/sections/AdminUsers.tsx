import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, Check, Plus, UserCheck, Search, Key, Sparkles, Mail, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function AdminUsers({ roleInfo, user }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Promote User State
  const [targetInput, setTargetEmailOrId] = useState('');
  const [targetRole, setTargetRole] = useState('admin');
  const [promoting, setPromoting] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const changeRole = async (target_id: string, new_role: string, email?: string) => {
    setUpdating(target_id);
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: target_id, email: email || null, role: new_role }),
      });
      setMsg(`Updated role to ${new_role}`);
      setTimeout(() => setMsg(''), 3000);
      await fetchUsers();
    } catch (e) {
      alert('Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  const handlePromoteByInput = async () => {
    if (!targetInput.trim()) return;
    setPromoting(true);
    const input = targetInput.trim();
    const isEmail = input.includes('@');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: isEmail ? null : input,
          email: isEmail ? input : null,
          role: targetRole,
          full_name: isEmail ? input.split('@')[0] : 'Admin User',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to grant role');

      setMsg(`✓ Successfully registered ${input} as ${targetRole.toUpperCase()}!`);
      setTimeout(() => setMsg(''), 4000);
      setTargetEmailOrId('');
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to assign role');
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Users size={24} className="text-blue-400" /> User & Role Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Register admins by Supabase Auth User ID or Email address instantly.</p>
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs px-4 py-3 rounded-2xl flex items-center gap-2">
          <CheckCircle2 size={16} /> {msg}
        </div>
      )}

      {/* Grant Admin Permissions Box */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
        <h2 className="text-sm font-black text-white flex items-center gap-2">
          <Shield size={16} className="text-amber-400" /> Grant Admin Permissions by ID or Email
        </h2>
        <p className="text-slate-400 text-xs leading-relaxed">
          Type the student's <strong>Supabase Auth User ID (UUID)</strong> or <strong>Google Email</strong> address to immediately promote them to Admin.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="text"
            placeholder="Enter Supabase User ID (UUID) or Email..."
            value={targetInput}
            onChange={e => setTargetEmailOrId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePromoteByInput()}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <select
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white font-bold px-3 py-2.5 rounded-xl text-xs focus:outline-none"
          >
            <option value="admin">👑 Admin</option>
            <option value="teacher">👨‍🏫 Teacher</option>
            <option value="student">🎓 Student</option>
          </select>
          <button
            onClick={handlePromoteByInput}
            disabled={promoting || !targetInput.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {promoting ? 'Granting...' : 'Grant Role'}
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner size="lg" text="Loading users…" /> : (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">Registered Users ({users.length})</h3>
          {users.map(u => (
            <div key={u.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-sm truncate">{u.full_name || 'Student'}</p>
                  {u.role === 'admin' && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-slate-400 mt-0.5 text-[11px] truncate">{u.email || u.id}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">Grade {u.grade || 10} · {u.school_name || 'Nepal'} · {(u.xp_points || 0).toLocaleString()} XP</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={u.role || 'student'}
                  onChange={e => changeRole(u.id, e.target.value, u.email)}
                  disabled={updating === u.id}
                  className={`border font-bold px-3 py-1.5 rounded-xl text-xs focus:outline-none ${
                    u.role === 'admin' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-950 border-slate-800 text-emerald-400'
                  }`}
                >
                  <option value="student">student</option>
                  <option value="teacher">teacher</option>
                  <option value="moderator">moderator</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
