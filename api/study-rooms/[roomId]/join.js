import supabase from '../../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const { roomId } = req.query;

    if (req.method === 'POST') {
      const { user_id, user_name, user_grade, user_school, user_district, xp_points, streak_count, password } = req.body;

      // Fetch room
      const { data: room, error: roomErr } = await supabase
        .from('study_rooms').select('*').eq('id', roomId).single();
      if (roomErr || !room) return res.status(404).json({ error: 'Room not found' });

      // Fetch settings (may not exist for older rooms)
      const { data: settings } = await supabase
        .from('room_settings').select('*').eq('room_id', roomId).single();

      // Checks
      if (settings?.status === 'closed') return res.status(400).json({ error: 'Room is closed' });
      if (settings?.expires_at && new Date(settings.expires_at) < new Date()) {
        return res.status(400).json({ error: 'Room has expired' });
      }
      if (!room.is_public && settings?.password && settings.password !== password) {
        return res.status(403).json({ error: 'Incorrect password' });
      }
      const maxMembers = settings?.max_members || 20;
      if ((room.member_count || 0) >= maxMembers) {
        return res.status(400).json({ error: `Room is full (max ${maxMembers})` });
      }

      // Upsert member
      const { data: existing } = await supabase
        .from('room_members').select('id').eq('room_id', roomId).eq('user_id', user_id).single();

      if (!existing) {
        await supabase.from('room_members').insert({
          room_id: parseInt(roomId),
          user_id,
          user_name: user_name || 'Student',
          user_grade: user_grade || null,
          user_school: user_school || null,
          user_district: user_district || null,
          xp_points: xp_points || 0,
          streak_count: streak_count || 0,
          avatar_initial: (user_name || 'S')[0].toUpperCase(),
        });
        await supabase.from('study_rooms')
          .update({ member_count: (room.member_count || 0) + 1 })
          .eq('id', roomId);

        // Post system message — use whichever messages table works
        const sysMsg = { room_id: parseInt(roomId), user_id: 'system', user_name: 'System', content: `👋 ${user_name} joined the room` };
        // Try new table first, fall back to old
        const { error: msgErr } = await supabase.from('room_messages').insert(sysMsg);
        if (msgErr) {
          await supabase.from('room_messages_v2').insert({ ...sysMsg, msg_type: 'system' }).catch(() => {});
        }
      } else {
        await supabase.from('room_members')
          .update({ last_seen: new Date().toISOString() })
          .eq('room_id', roomId).eq('user_id', user_id);
      }

      return res.status(200).json({ ok: true, room: { ...room, settings: settings || null } });
    }

    if (req.method === 'DELETE') {
      const { user_id, user_name } = req.body;
      await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', user_id);
      const { data: room } = await supabase.from('study_rooms').select('member_count').eq('id', roomId).single();
      if (room) {
        await supabase.from('study_rooms')
          .update({ member_count: Math.max(0, (room.member_count || 1) - 1) })
          .eq('id', roomId);
      }
      // Best-effort system message
      const leaveMsg = { room_id: parseInt(roomId), user_id: 'system', user_name: 'System', content: `👋 ${user_name} left the room` };
      await supabase.from('room_messages').insert(leaveMsg).catch(() => {});
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('join error:', err);
    res.status(500).json({ error: err.message });
  }
}
