import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const { post_id, user_id, action } = req.body;
    if (action === 'like') {
      await supabase.from('post_likes').insert({ post_id, user_id }).catch(() => {});
      await supabase.from('community_posts').update({ like_count: supabase.raw('like_count + 1') }).eq('id', post_id).catch(() => {});
    } else {
      await supabase.from('post_likes').delete().eq('post_id', post_id).eq('user_id', user_id).catch(() => {});
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
