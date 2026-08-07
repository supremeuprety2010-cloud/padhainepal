import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('mock_tests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { title, subject_name, grade, mode, duration_minutes, question_count, chapter_id } = req.body;

      // Insert mock test
      const { data, error } = await supabase.from('mock_tests').insert({
        title,
        subject_name,
        grade: parseInt(grade || 10),
        mode: mode || 'subject',
        duration_minutes: parseInt(duration_minutes || 45),
        question_count: parseInt(question_count || 25),
      }).select().single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      await supabase.from('mock_tests').delete().eq('id', id);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin/mock-tests error:', err);
    res.status(500).json({ error: err.message });
  }
}
