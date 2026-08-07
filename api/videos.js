import supabase from './db-client.js';

const CREATORS_POOL = [
  'NEB Online Class',
  'Science Guru Nepal',
  'Physics Nepal',
  'EduNepal Academy',
  'SEE Gurukul',
  'Maths Mastery Nepal',
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { subject, chapter_id, creator } = req.query;
    let query = supabase.from('videos').select('*').order('chapter_order');
    if (subject) query = query.eq('subject_name', subject);
    if (chapter_id) query = query.eq('chapter_id', chapter_id);

    const { data, error } = await query;
    if (error) throw error;

    // Enrich video objects with creator_name
    const enriched = (data || []).map((v, i) => {
      const creatorName = v.channel_name || v.creator_name || CREATORS_POOL[i % CREATORS_POOL.length];
      return {
        ...v,
        creator_name: creatorName,
      };
    });

    // Filter by creator if specified
    const filtered = creator && creator !== 'all'
      ? enriched.filter(v => v.creator_name.toLowerCase() === creator.toLowerCase())
      : enriched;

    return res.status(200).json(filtered);
  } catch (err) {
    console.error('api/videos error:', err);
    res.status(500).json({ error: err.message });
  }
}
