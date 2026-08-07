import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { user_id, amount } = req.body;
    if (!user_id || !amount) return res.status(400).json({ error: 'user_id and amount required' });
    const { data: user, error: fetchErr } = await supabase.from('users').select('xp_points').eq('id', user_id).single();
    if (fetchErr) throw fetchErr;
    const newXP = (user?.xp_points || 0) + amount;
    const { data, error } = await supabase.from('users').update({ xp_points: newXP, updated_at: new Date().toISOString() }).eq('id', user_id).select('xp_points').single();
    if (error) throw error;
    return res.status(200).json({ xp_points: data.xp_points });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
