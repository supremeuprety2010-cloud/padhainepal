import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const { type, institute_id, limit = 20 } = req.query;
    let query = supabase.from('institute_posts').select('*, institutes(name, type, verified, avatar_url)').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(parseInt(limit));
    if (type) query = query.eq('post_type', type);
    if (institute_id) query = query.eq('institute_id', parseInt(institute_id));
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
