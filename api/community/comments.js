import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { post_id } = req.query;
      const { data, error } = await supabase.from('community_comments').select('*').eq('post_id', post_id).order('created_at', { ascending: true });
      if (error) throw error;
      // Fetch replies for each comment
      const withReplies = await Promise.all((data || []).map(async c => {
        const { data: replies } = await supabase.from('comment_replies').select('*').eq('comment_id', c.id).order('created_at', { ascending: true });
        return { ...c, replies: replies || [] };
      }));
      return res.status(200).json(withReplies);
    }
    if (req.method === 'POST') {
      const { post_id, user_id, user_name, user_grade, content, parent_comment_id } = req.body;
      if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
      if (parent_comment_id) {
        // Reply
        const { data, error } = await supabase.from('comment_replies').insert({ comment_id: parent_comment_id, user_id, user_name, content }).select().single();
        if (error) throw error;
        await supabase.from('community_comments').update({ reply_count: supabase.raw('reply_count + 1') }).eq('id', parent_comment_id).catch(() => {});
        return res.status(201).json(data);
      }
      const { data, error } = await supabase.from('community_comments').insert({ post_id, user_id, user_name, user_grade, content }).select().single();
      if (error) throw error;
      await supabase.from('community_posts').update({ comment_count: supabase.raw('comment_count + 1') }).eq('id', post_id).catch(() => {});
      return res.status(201).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
