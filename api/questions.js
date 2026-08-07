import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { subject, chapter_id, difficulty, limit = 10, offset = 0 } = req.query;
      let query = supabase.from('questions')
        .select('id, question_text, options, correct_answer, explanation, difficulty, year_asked, chapter_id, chapters(title, subject_name)')
        .limit(parseInt(limit))
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (chapter_id) query = query.eq('chapter_id', chapter_id);
      if (difficulty) query = query.eq('difficulty', difficulty);
      if (subject && !chapter_id) {
        // Join via chapters
        const { data: chs } = await supabase.from('chapters').select('id').eq('subject_name', subject);
        if (chs && chs.length > 0) {
          query = query.in('chapter_id', chs.map(c => c.id));
        }
      }
      query = query.order('id');

      const { data, error } = await query;
      if (error) throw error;

      const formatted = (data || []).map(q => ({
        ...q,
        chapter_title: q.chapters?.title || '',
        subject_name: q.chapters?.subject_name || '',
        chapters: undefined,
      }));
      return res.status(200).json(formatted);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Questions API error:', err);
    res.status(500).json({ error: err.message });
  }
}
