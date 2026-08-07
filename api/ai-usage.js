import supabase from './db-client.js';

const DAILY_LIMIT = 10;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { user_id } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase.from('ai_usage').select('*', { count: 'exact', head: true }).eq('user_id', user_id).gte('created_at', today);
    return res.status(200).json({ used: count || 0, remaining: Math.max(0, DAILY_LIMIT - (count || 0)), limit: DAILY_LIMIT });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
