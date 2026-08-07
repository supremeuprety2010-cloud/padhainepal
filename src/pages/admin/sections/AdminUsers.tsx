import { useState, useEffect } from 'react';
import { Users, Shield, Check, Lock, ExternalLink } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function AdminUsers({ roleInfo, user }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const changeRole = async (target_user_id: string, new_role: string) => {
    setUpdating(target_user_id);
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: target_user_id, role: new_role, admin_user_id: user?.id }),
      });
      fetchUsers();
    } finally { setUpdating(null); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Users size={24} className="text-blue-400" /> User & Role Management</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage user roles (student | teacher | moderator | admin) with server-side authorization.</p>
      </div>

      {loading ? <LoadingSpinner size="lg" text="Loading users…" /> : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white text-sm">{u.full_name || 'Student'}</p>
                <p className="text-slate-400 mt-0.5">Grade {u.grade || 10} · {u.school_name || 'Nepal'} · {u.xp_points || 0} XP</p>
              </div>

              <div className="flex items-center gap-2">
                <select value={u.role || 'student'} onChange={e => changeRole(u.id, e.target.value)} disabled={updating === u.id} className="bg-slate-950 border border-slate-800 text-emerald-400 font-bold px-3 py-1.5 rounded-xl text-xs focus:outline-none">
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
