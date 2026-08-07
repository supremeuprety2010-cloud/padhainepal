import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { q, district, province, limit = 20 } = req.query;
    let query = supabase.from('schools').select('id, name, district, province, type').limit(parseInt(limit));
    if (q) query = query.ilike('name', `%${q}%`);
    if (district) query = query.eq('district', district);
    if (province) query = query.eq('province', province);
    query = query.order('name');
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json(data || []);
  } catch (err) {
    console.error('Schools API error:', err);
    res.status(500).json({ error: err.message });
  }
}
