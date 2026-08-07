import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const [{ data: users }, { data: roles }] = await Promise.all([
        supabase.from('users').select('id, full_name, grade, school_name, district, xp_points, streak_count, created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('user_roles').select('*'),
      ]);

      const roleMap = {};
      (roles || []).forEach(r => { roleMap[r.user_id] = r; });

      const enriched = (users || []).map(u => ({
        ...u,
        role: roleMap[u.id]?.role || 'student',
        school_id: roleMap[u.id]?.school_id || null,
      }));

      return res.status(200).json(enriched);
    }

    if (req.method === 'PUT') {
      const { user_id, role, school_id, admin_user_id } = req.body;

      const { data, error } = await supabase.from('user_roles').upsert({
        user_id,
        role,
        school_id: school_id || null,
        granted_by: admin_user_id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' }).select().single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin/users error:', err);
    res.status(500).json({ error: err.message });
  }
}
