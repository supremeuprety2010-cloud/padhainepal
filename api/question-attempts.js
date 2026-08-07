import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { user_id, question_id, selected_answer, is_correct } = req.body;
      const { data, error } = await supabase.from('question_attempts').insert({
        user_id, question_id, selected_answer, is_correct, attempted_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;

      // Award XP if correct
      if (is_correct) {
        await supabase.rpc('increment_xp', { user_id_param: user_id, xp_amount: 5 }).catch(() => {});
      }
      return res.status(201).json(data);
    }
    if (req.method === 'GET') {
      const { user_id, limit = 50 } = req.query;
      const { data, error } = await supabase.from('question_attempts').select('*').eq('user_id', user_id).order('attempted_at', { ascending: false }).limit(parseInt(limit));
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
