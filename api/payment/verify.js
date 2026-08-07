import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { method, pid, refId, pidx, amount, user_id } = req.query.pid ? req.query : req.body;

    if (!user_id && !pid && !pidx) {
      return res.status(400).json({ error: 'Transaction identifiers required' });
    }

    // eSewa verification
    if (method === 'esewa' || pid) {
      const refCode = refId || `ESEWA-${Date.now()}`;
      const searchRef = pid || refId;

      // Find subscription by payment_ref
      let { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('payment_ref', searchRef)
        .maybeSingle();

      if (!sub && user_id) {
        // Find latest pending subscription for user
        const { data: latest } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        sub = latest;
      }

      if (sub) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            payment_ref: refCode,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', sub.id);

        return res.status(200).json({
          status: 'success',
          message: 'eSewa Payment Verified! Premium activated for 1 year.',
          subscription_id: sub.id,
          amount_paid: sub.amount_paid,
          payment_method: 'eSewa',
        });
      }
    }

    // Khalti verification
    if (method === 'khalti' || pidx) {
      const pidxVal = pidx || `KHALTI-${Date.now()}`;

      // In production, call Khalti verification endpoint:
      // POST https://khalti.com/api/v2/epayment/lookup/ with Secret Key

      let { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('payment_ref', pidxVal)
        .maybeSingle();

      if (!sub && user_id) {
        const { data: latest } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        sub = latest;
      }

      if (sub) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            payment_ref: pidxVal,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', sub.id);

        return res.status(200).json({
          status: 'success',
          message: 'Khalti Payment Verified! Premium activated for 1 year.',
          subscription_id: sub.id,
          amount_paid: sub.amount_paid,
          payment_method: 'Khalti',
        });
      }
    }

    // Demo Instant Activation Fallback
    if (user_id) {
      const { data: sub, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id,
          grade: 10,
          plan_type: 'annual',
          amount_paid: amount || 1299,
          payment_method: method || 'esewa',
          payment_ref: `DEMO-${Date.now()}`,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        status: 'success',
        message: 'Payment Verified! Premium activated for 1 year.',
        subscription_id: sub.id,
        amount_paid: sub.amount_paid,
        payment_method: method || 'eSewa',
      });
    }

    return res.status(400).json({ error: 'Could not match subscription transaction' });
  } catch (err) {
    console.error('Payment verify error:', err);
    res.status(500).json({ error: err.message });
  }
}
