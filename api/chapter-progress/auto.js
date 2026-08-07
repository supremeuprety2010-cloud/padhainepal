import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { user_id, chapter_id, subject } = req.body;
    // Count MCQ attempts for this chapter
    const { count: mcqCount } = await supabase.from('question_attempts').select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .in('question_id', supabase.from('questions').select('id').eq('chapter_id', chapter_id));
    
    const newStatus = (mcqCount || 0) >= 5 ? 'in_progress' : 'not_started';
    
    const { data: existing } = await supabase.from('chapter_progress').select('id, status').eq('user_id', user_id).eq('chapter_id', chapter_id).single();
    
    // Don't downgrade from 'completed'
    if (existing?.status === 'completed') return res.status(200).json({ status: 'completed', unchanged: true });
    
    if (existing) {
      await supabase.from('chapter_progress').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('chapter_progress').insert({ user_id, chapter_id, subject, status: newStatus });
    }
    return res.status(200).json({ status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
