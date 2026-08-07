import supabase from '../../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { roomId } = req.query;
    const { action, minutes, user_id } = req.body;
    const { data: room } = await supabase.from('study_rooms').select('created_by').eq('id', roomId).single();
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.created_by !== user_id) return res.status(403).json({ error: 'Only the room admin can control the timer' });
    const { data: settings } = await supabase.from('room_settings').select('*').eq('room_id', roomId).single();
    let settingsUpdates = {};
    let msgContent = '';
    if (action === 'start') {
      settingsUpdates = { room_timer_end: new Date(Date.now() + (minutes || 25) * 60 * 1000).toISOString(), room_timer_running: true };
      msgContent = `⏱️ Admin started a ${minutes || 25}-min focus timer`;
    } else if (action === 'extend') {
      const base = settings?.room_timer_end ? new Date(settings.room_timer_end) : new Date();
      const newEnd = new Date(Math.max(base.getTime(), Date.now()) + (minutes || 10) * 60 * 1000);
      settingsUpdates = { room_timer_end: newEnd.toISOString(), room_timer_running: true };
      msgContent = `⏱️ Admin added ${minutes || 10} more minutes to the timer`;
    } else if (action === 'stop') {
      settingsUpdates = { room_timer_end: null, room_timer_running: false };
      msgContent = '⏹️ Admin stopped the focus timer';
    } else if (action === 'extend_room') {
      const base = settings?.expires_at ? new Date(settings.expires_at) : new Date();
      const newExpiry = new Date(Math.max(base.getTime(), Date.now()) + (minutes || 30) * 60 * 1000);
      settingsUpdates = { expires_at: newExpiry.toISOString() };
      msgContent = `⏰ Admin extended the room by ${minutes || 30} minutes`;
    }
    if (Object.keys(settingsUpdates).length > 0) {
      if (settings) await supabase.from('room_settings').update(settingsUpdates).eq('room_id', roomId);
      else await supabase.from('room_settings').insert({ room_id: parseInt(roomId), ...settingsUpdates });
    }
    if (msgContent) await supabase.from('room_messages').insert({ room_id: parseInt(roomId), user_id: 'system', user_name: 'System', content: msgContent, msg_type: 'system' }).catch(() => {});
    return res.status(200).json({ ok: true, ...settingsUpdates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
