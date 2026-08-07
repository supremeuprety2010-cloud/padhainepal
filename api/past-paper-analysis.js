import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { subject } = req.query;
    // Get chapters for subject with question counts from past papers
    const { data: chapters, error } = await supabase.from('chapters').select('id, title, chapter_number').eq('subject_name', subject).order('chapter_number');
    if (error) throw error;

    // Count questions per chapter that have year_asked
    const analysis = await Promise.all((chapters || []).map(async (ch) => {
      const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('chapter_id', ch.id).not('year_asked', 'is', null);
      const { data: years } = await supabase.from('questions').select('year_asked').eq('chapter_id', ch.id).not('year_asked', 'is', null);
      const uniqueYears = [...new Set((years || []).map(q => q.year_asked))].sort().join(', ');
      return { chapter_title: ch.title, question_count: count || 0, years_appeared: uniqueYears };
    }));

    const total = analysis.reduce((s, a) => s + a.question_count, 0);
    const withPct = analysis.map(a => ({ ...a, weightage_pct: total > 0 ? Math.round((a.question_count / total) * 100) : 0 })).sort((a, b) => b.question_count - a.question_count);

    return res.status(200).json(withPct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
