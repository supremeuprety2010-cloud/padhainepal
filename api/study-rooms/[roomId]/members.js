import supabase from '../../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const { roomId } = req.query;
    const { data, error } = await supabase.from('room_members').select('*').eq('room_id', roomId).order('joined_at', { ascending: true });
    if (error) throw error;
    return res.status(200).json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
