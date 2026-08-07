import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { filter = 'all', user_id, grade, school, district, limit = 20, offset = 0 } = req.query;
      let data = [], error = null;

      if (filter === 'bookmarked' && user_id) {
        const { data: saved } = await supabase.from('saved_posts').select('post_id').eq('user_id', user_id);
        const ids = (saved || []).map(s => s.post_id);
        if (ids.length === 0) return res.status(200).json([]);
        const r = await supabase.from('community_posts').select('*').in('id', ids).order('created_at', { ascending: false });
        data = r.data || []; error = r.error;
      } else if (filter === 'trending') {
        const r = await supabase.from('community_posts').select('*').order('like_count', { ascending: false }).limit(parseInt(limit));
        data = r.data || []; error = r.error;
      } else if (filter === 'grade' && grade) {
        const r = await supabase.from('community_posts').select('*').eq('user_grade', parseInt(grade)).order('created_at', { ascending: false }).limit(parseInt(limit));
        data = r.data || []; error = r.error;
      } else if (filter === 'school' && school) {
        const r = await supabase.from('community_posts').select('*').eq('user_school', school).order('created_at', { ascending: false }).limit(parseInt(limit));
        data = r.data || []; error = r.error;
      } else if (filter === 'district' && district) {
        const r = await supabase.from('community_posts').select('*').eq('user_district', district).order('created_at', { ascending: false }).limit(parseInt(limit));
        data = r.data || []; error = r.error;
      } else {
        // 'all' or 'latest' — show public + matching visibility posts
        let query = supabase.from('community_posts').select('*').order('created_at', { ascending: false }).limit(parseInt(limit)).range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        // Only public posts for simplicity (visibility filter via OR is complex without RLS)
        query = query.eq('visibility', 'public');
        const r = await query;
        data = r.data || []; error = r.error;
      }

      if (error) throw error;

      // Normalise missing columns
      const normalised = data.map(p => ({
        ...p,
        post_type: p.post_type || 'text',
        images: p.images || [],
        share_count: p.share_count || 0,
      }));

      // Add liked/saved status
      if (user_id && normalised.length > 0) {
        const ids = normalised.map(p => p.id);
        const [{ data: likes }, { data: saves }] = await Promise.all([
          supabase.from('post_likes').select('post_id').eq('user_id', user_id).in('post_id', ids),
          supabase.from('saved_posts').select('post_id').eq('user_id', user_id).in('post_id', ids),
        ]);
        const likedSet = new Set((likes || []).map(l => l.post_id));
        const savedSet = new Set((saves || []).map(s => s.post_id));
        return res.status(200).json(normalised.map(p => ({ ...p, liked: likedSet.has(p.id), saved: savedSet.has(p.id) })));
      }
      return res.status(200).json(normalised);
    }

    if (req.method === 'POST') {
      const { user_id, user_name, user_grade, user_school, user_district, content, post_type, subject_tag, visibility, images } = req.body;
      if (!user_id || !content?.trim()) return res.status(400).json({ error: 'user_id and content required' });

      // Insert without columns that may not exist
      const insertData = {
        user_id, user_name, user_grade, user_school, user_district,
        content, visibility: visibility || 'public',
        subject_tag: subject_tag || null,
        like_count: 0, comment_count: 0,
      };
      const { data, error } = await supabase.from('community_posts').insert(insertData).select().single();
      if (error) throw error;
      return res.status(201).json({ ...data, post_type: post_type || 'text', images: images || [] });
    }

    if (req.method === 'DELETE') {
      const { post_id, user_id } = req.body;
      const { data: post } = await supabase.from('community_posts').select('user_id').eq('id', post_id).single();
      if (!post) return res.status(404).json({ error: 'Post not found' });
      if (post.user_id !== user_id) return res.status(403).json({ error: 'Not your post' });
      await supabase.from('community_posts').delete().eq('id', post_id);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('community/posts error:', err);
    res.status(500).json({ error: err.message });
  }
}
