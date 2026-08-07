import crypto from 'crypto';
import supabase from '../db-client.js';

function generateEsewaSignature(totalAmount, transactionUuid, productCode, secretKey = '8gBmInteraction') {
  // eSewa v2 signature string format: "total_amount,transaction_uuid,product_code"
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(message);
  return hmac.digest('base64');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user_id, grade, amount, method, return_url } = req.body;
    if (!user_id || !amount) {
      return res.status(400).json({ error: 'user_id and amount required' });
    }

    const txUuid = `PN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const host = return_url || 'https://padhanepal.vercel.app';

    // Record pending subscription in database
    const { data: sub, error: subErr } = await supabase
      .from('subscriptions')
      .insert({
        user_id,
        grade: grade || 10,
        plan_type: 'annual',
        amount_paid: amount,
        payment_method: method || 'esewa',
        payment_ref: txUuid,
        status: 'pending',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (subErr) throw subErr;

    if (method === 'esewa') {
      const merchantCode = process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST';
      const secretKey = process.env.ESEWA_SECRET_KEY || '8gBmInteraction';
      const totalAmt = String(amount);

      const signature = generateEsewaSignature(totalAmt, txUuid, merchantCode, secretKey);

      // eSewa ePay v2 Form Parameters
      const esewaParams = {
        amount: totalAmt,
        tax_amount: '0',
        total_amount: totalAmt,
        transaction_uuid: txUuid,
        product_code: merchantCode,
        product_service_charge: '0',
        product_delivery_charge: '0',
        success_url: `${host}/subscribe?payment=success&ref=${txUuid}&method=esewa`,
        failure_url: `${host}/subscribe?payment=failure&ref=${txUuid}&method=esewa`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature: signature,
      };

      return res.status(200).json({
        success: true,
        method: 'esewa',
        ref_id: txUuid,
        subscription_id: sub.id,
        form_url: process.env.ESEWA_ENV === 'production'
          ? 'https://epay.esewa.com.np/api/epay/main/v2/form'
          : 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
        params: esewaParams,
      });
    }

    if (method === 'khalti') {
      // Khalti initiate payload
      const khaltiPayload = {
        return_url: `${host}/subscribe?payment=success&ref=${txUuid}&method=khalti`,
        website_url: host,
        amount: amount * 100, // in paisa
        purchase_order_id: txUuid,
        purchase_order_name: `PadhaiNepal Grade ${grade || 10} Subscription`,
        customer_info: {
          name: 'Student',
          email: 'student@padhainepal.app',
        },
      };

      // Call Khalti API if KHALTI_SECRET_KEY is set
      const khaltiSecret = process.env.KHALTI_SECRET_KEY;
      if (khaltiSecret) {
        const khaltiRes = await fetch('https://a.khalti.com/api/v2/epayment/initiate/', {
          method: 'POST',
          headers: {
            'Authorization': `Key ${khaltiSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(khaltiPayload),
        });

        if (khaltiRes.ok) {
          const kData = await khaltiRes.json();
          return res.status(200).json({
            success: true,
            method: 'khalti',
            ref_id: txUuid,
            subscription_id: sub.id,
            payment_url: kData.payment_url,
            pidx: kData.pidx,
          });
        }
      }

      // Fallback redirect for Khalti sandbox or demo mode
      return res.status(200).json({
        success: true,
        method: 'khalti',
        ref_id: txUuid,
        subscription_id: sub.id,
        payment_url: `${host}/subscribe?payment=success&ref=${txUuid}&method=khalti`,
      });
    }

    res.status(400).json({ error: 'Unsupported payment method' });
  } catch (err) {
    console.error('Payment initiate error:', err);
    res.status(500).json({ error: err.message });
  }
}
