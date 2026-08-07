import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { type = 'public' } = req.query;
      let query = supabase.from('study_rooms').select('*').order('created_at', { ascending: false }).limit(30);
      if (type === 'public') query = query.eq('is_public', true);
      const { data: rooms, error } = await query;
      if (error) throw error;
      // Enrich with settings
      const roomIds = (rooms || []).map(r => r.id);
      let settingsMap = {};
      if (roomIds.length > 0) {
        const { data: settings } = await supabase.from('room_settings').select('*').in('room_id', roomIds);
        (settings || []).forEach(s => { settingsMap[s.room_id] = s; });
      }
      const now = new Date();
      const enriched = (rooms || []).map(r => ({ ...r, settings: settingsMap[r.id] || null })).filter(r => {
        const s = r.settings;
        if (!s) return true;
        if (s.status === 'closed') return false;
        if (s.expires_at && new Date(s.expires_at) < now) return false;
        return true;
      });
      return res.status(200).json(enriched);
    }
    if (req.method === 'POST') {
      const { name, subject, created_by, creator_name, is_public, password, duration_minutes, max_members, description } = req.body;
      // Create room
      const { data: room, error } = await supabase.from('study_rooms').insert({
        name, subject, created_by, creator_name,
        is_public: is_public !== false,
        member_count: 1,
        checklist: [],
      }).select().single();
      if (error) throw error;
      // Create settings
      const expiresAt = duration_minutes ? new Date(Date.now() + duration_minutes * 60 * 1000).toISOString() : null;
      const { data: settings } = await supabase.from('room_settings').insert({
        room_id: room.id,
        password: is_public ? null : (password || null),
        max_members: max_members || 20,
        description: description || null,
        expires_at: expiresAt,
        duration_minutes: duration_minutes || null,
        status: 'active',
      }).select().single();
      // Auto-join creator as member
      await supabase.from('room_members').insert({ room_id: room.id, user_id: created_by, user_name: creator_name, joined_at: new Date().toISOString() }).catch(() => {});
      return res.status(201).json({ ...room, settings });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('study-rooms error:', err);
    res.status(500).json({ error: err.message });
  }
}
