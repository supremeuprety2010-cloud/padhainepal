import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { post_id, user_id, action } = req.body;
    if (action === 'save') {
      await supabase.from('saved_posts').upsert({ post_id, user_id }, { onConflict: 'post_id,user_id' });
    } else {
      await supabase.from('saved_posts').delete().eq('post_id', post_id).eq('user_id', user_id);
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
