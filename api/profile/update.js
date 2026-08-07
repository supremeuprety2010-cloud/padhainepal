import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const {
      user_id, full_name, school_name, district, province,
      bio, avatar_url, avatar_color,
      instagram_url, facebook_url, linkedin_url, twitter_url, youtube_url, website_url,
    } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    // Update base users table for name + location
    const baseUpdates = {};
    if (full_name !== undefined) baseUpdates.full_name = full_name;
    if (school_name !== undefined) baseUpdates.school_name = school_name;
    if (district !== undefined) baseUpdates.district = district;
    if (province !== undefined) baseUpdates.province = province;
    if (Object.keys(baseUpdates).length > 0) {
      await supabase.from('users').update(baseUpdates).eq('id', user_id);
    }

    // Upsert extended profile
    const extData = {
      user_id, updated_at: new Date().toISOString(),
      ...(full_name !== undefined && { full_name }),
      ...(school_name !== undefined && { school_name }),
      ...(district !== undefined && { district }),
      ...(province !== undefined && { province }),
      ...(bio !== undefined && { bio }),
      ...(avatar_url !== undefined && { avatar_url }),
      ...(avatar_color !== undefined && { avatar_color }),
      ...(instagram_url !== undefined && { instagram_url }),
      ...(facebook_url !== undefined && { facebook_url }),
      ...(linkedin_url !== undefined && { linkedin_url }),
      ...(twitter_url !== undefined && { twitter_url }),
      ...(youtube_url !== undefined && { youtube_url }),
      ...(website_url !== undefined && { website_url }),
    };

    const { data: existing } = await supabase.from('user_profiles_ext').select('id').eq('user_id', user_id).single();
    let result;
    if (existing) {
      result = await supabase.from('user_profiles_ext').update(extData).eq('user_id', user_id).select().single();
    } else {
      result = await supabase.from('user_profiles_ext').insert(extData).select().single();
    }
    if (result.error) throw result.error;
    return res.status(200).json({ ok: true, ext: result.data });
  } catch (err) {
    console.error('profile update error:', err);
    res.status(500).json({ error: err.message });
  }
}
