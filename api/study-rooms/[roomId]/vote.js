import supabase from '../../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const { roomId } = req.query;
    if (req.method === 'GET') {
      const { data } = await supabase.from('room_votes').select('*').eq('room_id', roomId).eq('status', 'active').order('created_at', { ascending: false }).limit(1);
      return res.status(200).json(data?.[0] || null);
    }
    if (req.method === 'POST') {
      const { action, user_id, user_name, vote } = req.body;
      const { data: room } = await supabase.from('study_rooms').select('created_by, member_count').eq('id', roomId).single();
      if (!room) return res.status(404).json({ error: 'Room not found' });
      if (action === 'initiate') {
        if (room.created_by !== user_id) return res.status(403).json({ error: 'Only admin can call a vote' });
        await supabase.from('room_votes').update({ status: 'cancelled' }).eq('room_id', roomId).eq('status', 'active');
        const { data: voteData, error } = await supabase.from('room_votes').insert({
          room_id: parseInt(roomId), vote_type: 'end_room', initiated_by: user_id,
          status: 'active', yes_votes: JSON.stringify([user_id]), no_votes: JSON.stringify([]),
          total_members: room.member_count || 1,
          expires_at: new Date(Date.now() + 60 * 1000).toISOString(),
        }).select().single();
        if (error) throw error;
        await supabase.from('room_messages').insert({ room_id: parseInt(roomId), user_id: 'system', user_name: 'System', content: `🗳️ ${user_name} called a vote to end the room! Cast your vote (60 sec)`, msg_type: 'vote' }).catch(() => {});
        return res.status(201).json(voteData);
      }
      if (action === 'cast') {
        const { data: activeVote } = await supabase.from('room_votes').select('*').eq('room_id', roomId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single();
        if (!activeVote) return res.status(400).json({ error: 'No active vote' });
        if (new Date(activeVote.expires_at) < new Date()) {
          await supabase.from('room_votes').update({ status: 'expired' }).eq('id', activeVote.id);
          return res.status(400).json({ error: 'Vote has expired' });
        }
        let yesVotes = Array.isArray(activeVote.yes_votes) ? activeVote.yes_votes : JSON.parse(activeVote.yes_votes || '[]');
        let noVotes = Array.isArray(activeVote.no_votes) ? activeVote.no_votes : JSON.parse(activeVote.no_votes || '[]');
        yesVotes = yesVotes.filter((id) => id !== user_id);
        noVotes = noVotes.filter((id) => id !== user_id);
        if (vote === 'yes') yesVotes.push(user_id);
        else noVotes.push(user_id);
        const totalVotes = yesVotes.length + noVotes.length;
        const majority = Math.ceil(activeVote.total_members / 2);
        let newStatus = 'active';
        if (yesVotes.length >= majority) newStatus = 'passed';
        else if (noVotes.length >= majority) newStatus = 'rejected';
        else if (totalVotes >= activeVote.total_members) newStatus = yesVotes.length > noVotes.length ? 'passed' : 'rejected';
        await supabase.from('room_votes').update({ yes_votes: yesVotes, no_votes: noVotes, status: newStatus }).eq('id', activeVote.id);
        if (newStatus === 'passed') {
          await supabase.from('room_settings').update({ status: 'closed' }).eq('room_id', roomId);
          await supabase.from('room_messages').insert({ room_id: parseInt(roomId), user_id: 'system', user_name: 'System', content: '🏁 Vote passed — room is closing. Thanks for studying together! 📚', msg_type: 'system' }).catch(() => {});
        } else if (newStatus === 'rejected') {
          await supabase.from('room_messages').insert({ room_id: parseInt(roomId), user_id: 'system', user_name: 'System', content: '✅ Vote rejected — keep studying hard!', msg_type: 'system' }).catch(() => {});
        }
        return res.status(200).json({ ok: true, status: newStatus, yes: yesVotes.length, no: noVotes.length, majority });
      }
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
