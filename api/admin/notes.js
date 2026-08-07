import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { subject, chapter_id } = req.query;
      let query = supabase.from('notes').select('*').order('id', { ascending: false });
      if (subject) query = query.eq('subject_name', subject);
      if (chapter_id) query = query.eq('chapter_id', parseInt(chapter_id));
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { chapter_id, subject_name, title, content, file_url, grade, uploaded_by } = req.body;
      const { data, error } = await supabase.from('notes').insert({
        chapter_id: chapter_id ? parseInt(chapter_id) : null,
        subject_name,
        title,
        content: content || `# ${title}\n\n[Download File](${file_url})`,
        grade: grade ? parseInt(grade) : 10,
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, title, content, file_url } = req.body;
      const { data, error } = await supabase.from('notes').update({
        title,
        content: content || `# ${title}\n\n[Download File](${file_url})`,
      }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      await supabase.from('notes').delete().eq('id', id);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin/notes error:', err);
    res.status(500).json({ error: err.message });
  }
}
