import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { doubt_id } = req.query;
      const { data, error } = await supabase.from('doubt_answers').select('*').eq('doubt_id', doubt_id).order('upvotes', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const { doubt_id, user_id, user_name, content } = req.body;
      const { data, error } = await supabase.from('doubt_answers').insert({ doubt_id, user_id, user_name, content }).select().single();
      if (error) throw error;
      await supabase.from('doubts').update({ reply_count: supabase.raw('reply_count + 1') }).eq('id', doubt_id).catch(() => {});
      return res.status(201).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
