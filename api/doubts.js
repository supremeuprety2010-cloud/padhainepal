import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { subject, q, limit = 30 } = req.query;
      let query = supabase.from('doubts').select('*').order('created_at', { ascending: false }).limit(parseInt(limit));
      if (subject) query = query.eq('subject', subject);
      if (q) query = query.ilike('title', `%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const { user_id, user_name, title, body, subject } = req.body;
      const { data, error } = await supabase.from('doubts').insert({ user_id, user_name, title, body, subject, upvotes: 0, reply_count: 0 }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
