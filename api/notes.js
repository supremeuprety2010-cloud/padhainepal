import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { subject, chapter_id, note_type } = req.query;

    let query = supabase
      .from('notes')
      .select('*')
      .order('id', { ascending: true });

    if (subject) query = query.eq('subject_name', subject);
    if (chapter_id) query = query.eq('chapter_id', parseInt(chapter_id));

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (err) {
    console.error('api/notes error:', err);
    res.status(500).json({ error: err.message });
  }
}
