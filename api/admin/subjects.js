import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data: subjects, error: subErr } = await supabase.from('subjects').select('*').order('grade').order('name');
      if (subErr) throw subErr;

      const { data: chapters, error: chErr } = await supabase.from('chapters').select('*').order('chapter_number');
      if (chErr) throw chErr;

      // Group chapters by subject_name & grade
      const structured = (subjects || []).map(s => {
        const subChapters = (chapters || []).filter(c => c.subject_name === s.name && c.grade === s.grade);
        return { ...s, chapters: subChapters };
      });

      return res.status(200).json(structured);
    }

    if (req.method === 'POST') {
      const { type, name, grade, stream, description, icon, subject_name, chapter_number } = req.body;

      if (type === 'chapter') {
        const { data, error } = await supabase.from('chapters').insert({
          subject_name,
          grade: parseInt(grade),
          chapter_number: parseInt(chapter_number || 1),
          title: name,
          description: description || null,
        }).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      }

      // Default: create subject
      const { data, error } = await supabase.from('subjects').insert({
        name,
        grade: parseInt(grade),
        stream: stream || null,
        description: description || null,
        icon: icon || '📚',
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { type, id, title, name, description, icon, chapter_number, chapters_order } = req.body;

      if (type === 'reorder_chapters' && Array.isArray(chapters_order)) {
        for (const ch of chapters_order) {
          await supabase.from('chapters').update({ chapter_number: ch.chapter_number }).eq('id', ch.id);
        }
        return res.status(200).json({ ok: true });
      }

      if (type === 'chapter') {
        const { data, error } = await supabase.from('chapters').update({
          title: title || name,
          description: description || null,
          chapter_number: chapter_number ? parseInt(chapter_number) : undefined,
        }).eq('id', id).select().single();
        if (error) throw error;
        return res.status(200).json(data);
      }

      // Subject update
      const { data, error } = await supabase.from('subjects').update({
        name,
        description: description || null,
        icon: icon || '📚',
      }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { type, id } = req.body;
      if (type === 'chapter') {
        await supabase.from('chapters').delete().eq('id', id);
        return res.status(200).json({ ok: true });
      }
      await supabase.from('subjects').delete().eq('id', id);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin/subjects error:', err);
    res.status(500).json({ error: err.message });
  }
}
