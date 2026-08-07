import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { subject, chapter_id, difficulty, search, limit = 100 } = req.query;
      let query = supabase.from('questions').select('*').limit(parseInt(limit)).order('id', { ascending: false });

      if (chapter_id) query = query.eq('chapter_id', parseInt(chapter_id));
      if (difficulty) query = query.eq('difficulty', difficulty);
      if (search) query = query.ilike('question_text', `%${search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { is_bulk, csv_rows, chapter_id, question_text, options, correct_answer, explanation, difficulty, year_asked, source } = req.body;

      // BULK CSV IMPORT
      if (is_bulk && Array.isArray(csv_rows)) {
        const validatedRows = [];
        const errors = [];

        for (let i = 0; i < csv_rows.length; i++) {
          const row = csv_rows[i];
          if (!row.question || !row.option_a || !row.option_b || !row.option_c || !row.option_d) {
            errors.push(`Row ${i + 1}: Missing question text or options`);
            continue;
          }

          let correctIdx = 0;
          const ans = String(row.correct_answer || '').trim().toLowerCase();
          if (ans === 'b' || ans === '1' || ans === row.option_b?.toLowerCase()) correctIdx = 1;
          else if (ans === 'c' || ans === '2' || ans === row.option_c?.toLowerCase()) correctIdx = 2;
          else if (ans === 'd' || ans === '3' || ans === row.option_d?.toLowerCase()) correctIdx = 3;

          validatedRows.push({
            chapter_id: row.chapter_id ? parseInt(row.chapter_id) : (chapter_id ? parseInt(chapter_id) : 1),
            question_text: row.question.trim(),
            options: [row.option_a.trim(), row.option_b.trim(), row.option_c.trim(), row.option_d.trim()],
            correct_answer: correctIdx,
            explanation: row.explanation || null,
            difficulty: row.difficulty || 'medium',
            year_asked: row.year ? parseInt(row.year) : null,
            source: row.source || 'NEB Import',
          });
        }

        if (validatedRows.length === 0) {
          return res.status(400).json({ error: 'No valid rows found in CSV', details: errors });
        }

        const { data, error } = await supabase.from('questions').insert(validatedRows).select();
        if (error) throw error;
        return res.status(201).json({ count: data.length, errors });
      }

      // Single Question
      const { data, error } = await supabase.from('questions').insert({
        chapter_id: parseInt(chapter_id),
        question_text,
        options: Array.isArray(options) ? options : [options.a, options.b, options.c, options.d],
        correct_answer: parseInt(correct_answer || 0),
        explanation: explanation || null,
        difficulty: difficulty || 'medium',
        year_asked: year_asked ? parseInt(year_asked) : null,
        source: source || 'NEB Board',
      }).select().single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, question_text, options, correct_answer, explanation, difficulty, year_asked } = req.body;
      const { data, error } = await supabase.from('questions').update({
        question_text,
        options,
        correct_answer: parseInt(correct_answer),
        explanation,
        difficulty,
        year_asked: year_asked ? parseInt(year_asked) : null,
      }).eq('id', id).select().single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      await supabase.from('questions').delete().eq('id', id);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin/questions error:', err);
    res.status(500).json({ error: err.message });
  }
}
