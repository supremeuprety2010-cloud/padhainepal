import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { user_id, mode, subject, answers, score, time_taken, total_questions, correct_answers } = req.body;
      const { data, error } = await supabase.from('test_attempts').insert({
        user_id, mode, subject, answers, score, time_taken, total_questions, correct_answers,
        submitted_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;

      // Award XP based on score
      const xp = Math.round(score / 10) * 5;
      if (xp > 0) await supabase.rpc('increment_xp', { user_id_param: user_id, xp_amount: xp }).catch(() => {});

      return res.status(201).json(data);
    }
    if (req.method === 'GET') {
      const { user_id, limit = 10 } = req.query;
      const { data, error } = await supabase.from('test_attempts').select('*').eq('user_id', user_id).order('submitted_at', { ascending: false }).limit(parseInt(limit));
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
