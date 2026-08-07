import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { subject, grade } = req.query;
    let query = supabase.from('chapters').select('*').order('chapter_number');
    if (subject) query = query.eq('subject_name', subject);
    if (grade) query = query.eq('grade', parseInt(grade));
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
