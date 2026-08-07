import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id, subject } = req.query;
      let query = supabase.from('chapter_progress').select('*').eq('user_id', user_id);
      if (subject) query = query.eq('subject', subject);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const { user_id, chapter_id, subject, status } = req.body;
      const { data: existing } = await supabase.from('chapter_progress').select('id').eq('user_id', user_id).eq('chapter_id', chapter_id).single();
      let result;
      if (existing) {
        result = await supabase.from('chapter_progress').update({ status, updated_at: new Date().toISOString() }).eq('user_id', user_id).eq('chapter_id', chapter_id).select().single();
      } else {
        result = await supabase.from('chapter_progress').insert({ user_id, chapter_id, subject, status }).select().single();
      }
      if (result.error) throw result.error;

      // Award XP for completing a chapter
      if (status === 'done') {
        await supabase.rpc('increment_xp', { user_id_param: user_id, xp_amount: 25 }).catch(() => {});
      }
      return res.status(200).json(result.data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
