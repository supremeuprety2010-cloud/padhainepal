import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const [{ data: schools }, { data: claims }] = await Promise.all([
        supabase.from('schools').select('*').order('name'),
        supabase.from('school_claims').select('*').order('created_at', { ascending: false }),
      ]);
      return res.status(200).json({ schools: schools || [], claims: claims || [] });
    }

    if (req.method === 'POST') {
      // Merge schools
      const { primary_school_id, duplicate_school_id, admin_user_id } = req.body;

      if (!primary_school_id || !duplicate_school_id) {
        return res.status(400).json({ error: 'primary_school_id and duplicate_school_id required' });
      }

      // Reassign users
      await supabase.from('users').update({ school_id: String(primary_school_id) }).eq('school_id', String(duplicate_school_id));

      // Record merge
      await supabase.from('school_merges').insert({
        primary_school_id: parseInt(primary_school_id),
        merged_school_id: parseInt(duplicate_school_id),
        merged_by: admin_user_id,
      });

      // Delete duplicate school
      await supabase.from('schools').delete().eq('id', duplicate_school_id);

      return res.status(200).json({ ok: true, message: 'Schools merged successfully' });
    }

    if (req.method === 'PUT') {
      // Handle Claim approval/rejection
      const { claim_id, status, admin_user_id } = req.body;
      const { data: claim, error: claimErr } = await supabase.from('school_claims').update({
        status,
        reviewed_by: admin_user_id,
      }).eq('id', claim_id).select().single();

      if (claimErr) throw claimErr;

      if (status === 'approved' && claim) {
        // Assign teacher role scoped to school
        await supabase.from('user_roles').upsert({
          user_id: claim.user_id,
          role: 'teacher',
          school_id: String(claim.school_id),
          granted_by: admin_user_id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }

      return res.status(200).json(claim);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin/schools error:', err);
    res.status(500).json({ error: err.message });
  }
}
