import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const { limit = 20 } = req.query;
    const { data, error } = await supabase.from('institutes').select('*').eq('verified', true).order('follower_count', { ascending: false }).limit(parseInt(limit));
    if (error) throw error;
    return res.status(200).json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
