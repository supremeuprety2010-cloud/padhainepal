import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { type = 'global', school_id, district, limit = 20 } = req.query;
    let query = supabase.from('users').select('id, full_name, xp_points, streak_count, school_name, district, grade').order('xp_points', { ascending: false }).limit(parseInt(limit));

    if (type === 'school' && school_id) query = query.eq('school_id', school_id);
    if (type === 'district' && district) query = query.eq('district', district);

    const { data, error } = await query;
    if (error) throw error;

    const formatted = (data || []).map((u, i) => ({
      id: u.id,
      user_id: u.id,
      user_name: u.full_name || 'Student',
      xp_points: u.xp_points || 0,
      streak_count: u.streak_count || 0,
      school_name: u.school_name || '',
      district: u.district || '',
      grade: u.grade,
      rank: i + 1,
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
}
