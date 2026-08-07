import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { user_id, duration_minutes, session_type } = req.body;
      const { data, error } = await supabase.from('pomodoro_sessions').insert({
        user_id, duration_minutes, session_type, started_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      // Award XP for focus sessions
      if (session_type === 'focus') {
        await supabase.rpc('increment_xp', { user_id_param: user_id, xp_amount: 10 }).catch(() => {});
      }
      return res.status(201).json(data);
    }
    if (req.method === 'GET') {
      const { user_id } = req.query;
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.from('pomodoro_sessions').select('duration_minutes').eq('user_id', user_id).eq('session_type', 'focus').gte('started_at', today);
      if (error) throw error;
      const today_minutes = (data || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      return res.status(200).json({ today_minutes });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
