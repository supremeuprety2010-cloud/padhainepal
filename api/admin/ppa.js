import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('past_paper_records').select('*').order('subject_name').order('year_asked', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { is_bulk, csv_rows, subject_name, chapter_title, year_asked, question_count, weightage_pct } = req.body;

      if (is_bulk && Array.isArray(csv_rows)) {
        const rows = csv_rows.map(r => ({
          subject_name: r.subject_name || subject_name,
          chapter_title: r.chapter_title,
          year_asked: parseInt(r.year || year_asked || 2023),
          question_count: parseInt(r.question_count || 1),
          weightage_pct: parseFloat(r.weightage_pct || 5),
        }));

        const { data, error } = await supabase.from('past_paper_records').insert(rows).select();
        if (error) throw error;
        return res.status(201).json({ count: data.length });
      }

      const { data, error } = await supabase.from('past_paper_records').insert({
        subject_name,
        chapter_title,
        year_asked: parseInt(year_asked),
        question_count: parseInt(question_count || 1),
        weightage_pct: parseFloat(weightage_pct || 5),
      }).select().single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      await supabase.from('past_paper_records').delete().eq('id', id);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin/ppa error:', err);
    res.status(500).json({ error: err.message });
  }
}
