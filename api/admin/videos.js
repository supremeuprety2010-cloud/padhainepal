import supabase from '../db-client.js';

export function extractYoutubeId(url) {
  if (!url) return null;
  // Match youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { subject } = req.query;
      let query = supabase.from('videos').select('*').order('chapter_order');
      if (subject) query = query.eq('subject_name', subject);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { chapter_id, subject_name, chapter_title, title, youtube_url, duration, channel_name } = req.body;
      const youtubeId = extractYoutubeId(youtube_url) || youtube_url;

      if (!youtubeId || youtubeId.length !== 11) {
        return res.status(400).json({ error: 'Invalid YouTube URL or ID' });
      }

      const { data, error } = await supabase.from('videos').insert({
        chapter_id: chapter_id ? parseInt(chapter_id) : null,
        subject_name,
        chapter_title: chapter_title || 'General',
        title,
        youtube_id: youtubeId,
        video_url: `https://www.youtube.com/watch?v=${youtubeId}`,
        duration: duration || '20:00',
        channel_name: channel_name || 'NEB Teacher',
        views: '1K',
        chapter_order: 1,
      }).select().single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, title, chapter_title, youtube_url, duration, channel_name } = req.body;
      const youtubeId = extractYoutubeId(youtube_url) || youtube_url;

      const { data, error } = await supabase.from('videos').update({
        title,
        chapter_title,
        ...(youtubeId && { youtube_id: youtubeId }),
        duration,
        channel_name,
      }).eq('id', id).select().single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      await supabase.from('videos').delete().eq('id', id);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin/videos error:', err);
    res.status(500).json({ error: err.message });
  }
}
