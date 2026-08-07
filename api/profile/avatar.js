import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { user_id, file_base64, file_name, content_type } = req.body;
    if (!user_id || !file_base64) return res.status(400).json({ error: 'user_id and file_base64 required' });
    const buffer = Buffer.from(file_base64, 'base64');
    const ext = content_type === 'image/png' ? 'png' : content_type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${user_id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, buffer, { contentType: content_type || 'image/jpeg', upsert: true });
    if (upErr) throw upErr;
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = urlData.publicUrl;
    // Save to ext profile
    const { data: existing } = await supabase.from('user_profiles_ext').select('id').eq('user_id', user_id).single();
    if (existing) {
      await supabase.from('user_profiles_ext').update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() }).eq('user_id', user_id);
    } else {
      await supabase.from('user_profiles_ext').insert({ user_id, avatar_url: avatarUrl });
    }
    return res.status(200).json({ url: avatarUrl });
  } catch (err) {
    console.error('avatar upload error:', err);
    res.status(500).json({ error: err.message });
  }
}
