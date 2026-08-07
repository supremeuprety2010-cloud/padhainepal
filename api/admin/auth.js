import supabase from '../db-client.js';

// Designated Superadmin User IDs
const SUPERADMIN_IDS = [
  'af8c2244-2be1-4032-8ba4-8cc46f06de5f',
];

export async function checkAdminRole(userId) {
  if (!userId) return { isAdmin: false, isTeacher: false, role: 'student', schoolId: null };

  // 1. Direct Superadmin ID match
  if (SUPERADMIN_IDS.includes(userId)) {
    // Ensure user_roles has record
    await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin', updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).catch(() => {});
    return { isAdmin: true, isTeacher: false, role: 'admin', schoolId: null };
  }

  // 2. Check user_roles table
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (roleRow) {
    return {
      isAdmin: roleRow.role === 'admin' || roleRow.role === 'moderator',
      isTeacher: roleRow.role === 'teacher',
      role: roleRow.role,
      schoolId: roleRow.school_id || null,
    };
  }

  // 3. Fallback: if user_roles table has 0 rows, first user becomes admin
  const { count } = await supabase.from('user_roles').select('*', { count: 'exact', head: true });
  if (count === 0) {
    await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' }).catch(() => {});
    return { isAdmin: true, isTeacher: false, role: 'admin', schoolId: null };
  }

  return { isAdmin: false, isTeacher: false, role: 'student', schoolId: null };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { userId } = req.query.userId ? req.query : req.body;
    const roleInfo = await checkAdminRole(userId);

    if (req.method === 'GET') {
      return res.status(200).json(roleInfo);
    }

    if (req.method === 'POST') {
      const { target_user_id, new_role, school_id, admin_user_id } = req.body;
      const callerRole = await checkAdminRole(admin_user_id);
      if (!callerRole.isAdmin || callerRole.role !== 'admin') {
        return res.status(403).json({ error: 'Only superadmins can manage roles' });
      }

      const { data, error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: target_user_id,
          role: new_role,
          school_id: school_id || null,
          granted_by: admin_user_id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin/auth error:', err);
    res.status(500).json({ error: err.message });
  }
}
