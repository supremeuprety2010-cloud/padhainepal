import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const { roomId } = req.query;
    if (req.method === 'GET') {
      const [{ data: room, error }, { data: settings }] = await Promise.all([
        supabase.from('study_rooms').select('*').eq('id', roomId).single(),
        supabase.from('room_settings').select('*').eq('room_id', roomId).single(),
      ]);
      if (error) throw error;
      return res.status(200).json({ ...room, settings: settings || null });
    }
    if (req.method === 'PUT') {
      const { checklist, name, subject, settings: settingsUpdates, ...rest } = req.body;
      const roomUpdates = {};
      if (checklist !== undefined) roomUpdates.checklist = checklist;
      if (name) roomUpdates.name = name;
      if (subject !== undefined) roomUpdates.subject = subject;
      let roomData = null;
      if (Object.keys(roomUpdates).length > 0) {
        const { data } = await supabase.from('study_rooms').update(roomUpdates).eq('id', roomId).select().single();
        roomData = data;
      }
      let settingsData = null;
      if (settingsUpdates) {
        const { data } = await supabase.from('room_settings').update(settingsUpdates).eq('room_id', roomId).select().single();
        settingsData = data;
      }
      return res.status(200).json({ ...(roomData || {}), settings: settingsData });
    }
    if (req.method === 'DELETE') {
      await supabase.from('room_settings').update({ status: 'closed' }).eq('room_id', roomId);
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
