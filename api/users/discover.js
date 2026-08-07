import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const { grade, district, school, stream, name, sort = 'xp', limit = 20 } = req.query;

    let query = supabase
      .from('users')
      .select('id, full_name, grade, stream, subjects, school_name, district, xp_points, streak_count')
      .eq('onboarding_complete', true)
      .limit(parseInt(limit));

    if (grade) query = query.eq('grade', parseInt(grade));
    if (district) query = query.eq('district', district);
    if (school) query = query.eq('school_name', school);
    if (stream) query = query.eq('stream', stream);
    if (name) query = query.ilike('full_name', `%${name}%`);

    if (sort === 'xp') query = query.order('xp_points', { ascending: false });
    else if (sort === 'streak') query = query.order('streak_count', { ascending: false });
    else query = query.order('xp_points', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
