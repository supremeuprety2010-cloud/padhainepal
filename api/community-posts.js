import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { visibility = 'public', school, district, limit = 30 } = req.query;
      let query = supabase.from('community_posts').select('*').order('created_at', { ascending: false }).limit(parseInt(limit));
      if (visibility === 'school' && school) query = query.eq('user_school', school).eq('visibility', 'school');
      else if (visibility === 'district' && district) query = query.eq('user_district', district);
      else query = query.eq('visibility', 'public');
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const { user_id, user_name, user_grade, user_school, user_district, content, visibility, subject_tag } = req.body;
      const { data, error } = await supabase.from('community_posts').insert({ user_id, user_name, user_grade, user_school, user_district, content, visibility: visibility || 'public', subject_tag }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
