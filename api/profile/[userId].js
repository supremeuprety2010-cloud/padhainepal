import supabase from '../db-client.js';

const ADMIN_IDS = ['af8c2244-2be1-4032-8ba4-8cc46f06de5f'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const { userId } = req.query;

    // Get base user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    // Get extended profile
    const { data: ext } = await supabase
      .from('user_profiles_ext')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Check user_roles
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    const role = ADMIN_IDS.includes(userId) ? 'admin' : (roleRow?.role || 'student');

    // Merge
    const merged = {
      ...user,
      role,
      is_admin: role === 'admin' || role === 'moderator',
      full_name:     ext?.full_name     || user.full_name,
      school_name:   ext?.school_name   || user.school_name,
      district:      ext?.district      || user.district,
      province:      ext?.province      || user.province,
      bio:           ext?.bio           || null,
      avatar_url:    ext?.avatar_url    || user.avatar_url || null,
      avatar_color:  ext?.avatar_color  || 'from-blue-500 to-indigo-600',
      instagram_url: ext?.instagram_url || null,
      facebook_url:  ext?.facebook_url  || null,
      linkedin_url:  ext?.linkedin_url  || null,
      twitter_url:   ext?.twitter_url   || null,
      youtube_url:   ext?.youtube_url   || null,
      website_url:   ext?.website_url   || null,
    };
    return res.status(200).json(merged);
  } catch (err) {
    console.error('profile/:userId error:', err);
    res.status(500).json({ error: err.message });
  }
}
