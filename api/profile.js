import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id } = req.query;
      if (!user_id) return res.status(400).json({ error: 'user_id required' });
      const { data, error } = await supabase.from('users').select('*').eq('id', user_id).single();
      if (error && error.code !== 'PGRST116') throw error;
      return res.status(200).json(data || null);
    }

    if (req.method === 'POST') {
      const { user_id, email, full_name, grade, stream, subjects, school_id, school_name, district, province } = req.body;
      if (!user_id) return res.status(400).json({ error: 'user_id required' });

      const { data: existing } = await supabase.from('users').select('id').eq('id', user_id).single();

      const profileData = {
        id: user_id,
        email: email || null,
        full_name: full_name || 'Student',
        grade: grade || 10,
        stream: stream || null,
        subjects: subjects || [],
        school_id: school_id || null,
        school_name: school_name || null,
        district: district || null,
        province: province || null,
        onboarding_complete: true,
        trial_start: new Date().toISOString(),
        xp_points: 0,
        streak_count: 0,
      };

      let result;
      if (existing) {
        result = await supabase.from('users').update(profileData).eq('id', user_id).select().single();
      } else {
        result = await supabase.from('users').insert(profileData).select().single();
      }
      if (result.error) throw result.error;
      return res.status(200).json(result.data);
    }

    if (req.method === 'PUT') {
      const { user_id, ...updates } = req.body;
      if (!user_id) return res.status(400).json({ error: 'user_id required' });
      const { data, error } = await supabase.from('users').update(updates).eq('id', user_id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Profile API error:', err);
    res.status(500).json({ error: err.message });
  }
}
