import supabase from '../../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const { roomId } = req.query;

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('room_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      // Normalise: add msg_type if missing
      const normalised = (data || []).map(m => ({
        ...m,
        msg_type: m.msg_type || (m.user_id === 'system' ? 'system' : 'text'),
      }));
      return res.status(200).json(normalised);
    }

    if (req.method === 'POST') {
      const { user_id, user_name, content, msg_type } = req.body;
      // Insert without msg_type first (column may not exist)
      const insertData = { room_id: parseInt(roomId), user_id, user_name, content };
      const { data, error } = await supabase
        .from('room_messages')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      // Update last_seen
      await supabase.from('room_members')
        .update({ last_seen: new Date().toISOString() })
        .eq('room_id', roomId).eq('user_id', user_id).catch(() => {});
      return res.status(201).json({ ...data, msg_type: msg_type || 'text' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('messages error:', err);
    res.status(500).json({ error: err.message });
  }
}
