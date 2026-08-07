import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Crown, Shield, Zap } from 'lucide-react';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/GlassCard';
import { SUBSCRIPTION_PRICES } from '../lib/constants';

export default function Subscribe() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [method, setMethod] = useState<'esewa' | 'khalti'>('esewa');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const grade = profile?.grade || 10;
  const price = SUBSCRIPTION_PRICES[grade];

  const features = [
    'Unlimited MCQ Practice',
    'Chapter-wise Mock Tests',
    'Full Exam Simulation',
    'AI Tutor (100 questions/day)',
    'Video Lectures',
    'Past Paper Analysis',
    'Chapter Progress Tracker',
    'Doubts Forum Access',
    'Leaderboard Rankings',
    'Daily Missions & XP',
  ];

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, grade, amount: price, method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.payment_url) window.location.href = data.payment_url;
      else alert(`Payment initiated! Reference: ${data.ref_id}\n\nIn production, you'd be redirected to ${method === 'esewa' ? 'eSewa' : 'Khalti'}.`);
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 pb-24">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 pt-12 pb-8">
        <BackButton light fallback="/profile" />
        <div className="flex items-center gap-3">
          <Crown size={28} className="text-white" />
          <div>
            <h1 className="text-white text-2xl font-black">Go Premium</h1>
            <p className="text-white/70 text-sm">Unlock everything for Grade {grade}</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Price Card */}
        <GlassCard className="p-5 text-center bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
          <p className="text-gray-500 text-sm mb-1">1-Year Subscription · Grade {grade}</p>
          <div className="flex items-baseline justify-center gap-1 mb-1">
            <span className="text-amber-600 font-bold text-lg">NPR</span>
            <span className="text-4xl font-black text-gray-800">{price.toLocaleString()}</span>
          </div>
          <p className="text-gray-400 text-xs">≈ NPR {Math.round(price / 12)}/month · Valid 1 year</p>
        </GlassCard>

        {/* Features */}
        <GlassCard className="p-4">
          <h3 className="font-bold text-gray-800 mb-3">What's included:</h3>
          <div className="grid grid-cols-1 gap-2">
            {features.map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-green-600" />
                </div>
                <span className="text-sm text-gray-700">{f}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Payment Method */}
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-3 block">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMethod('esewa')} className={`p-4 rounded-2xl border-2 transition-all ${method === 'esewa' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
              <div className="text-2xl mb-1">💚</div>
              <p className={`font-bold text-sm ${method === 'esewa' ? 'text-green-700' : 'text-gray-700'}`}>eSewa</p>
              <p className="text-xs text-gray-400">Nepal's #1 wallet</p>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMethod('khalti')} className={`p-4 rounded-2xl border-2 transition-all ${method === 'khalti' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'}`}>
              <div className="text-2xl mb-1">💜</div>
              <p className={`font-bold text-sm ${method === 'khalti' ? 'text-purple-700' : 'text-gray-700'}`}>Khalti</p>
              <p className="text-xs text-gray-400">Fast & secure</p>
            </motion.button>
          </div>
        </div>

        <GlassCard className="p-3 bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-blue-600" />
            <p className="text-xs text-blue-700">Secure payment via {method === 'esewa' ? 'eSewa' : 'Khalti'} · 100% safe</p>
          </div>
        </GlassCard>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2">{error}</div>}

        <motion.button whileTap={{ scale: 0.97 }} onClick={handlePayment} disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-amber-200 flex items-center justify-center gap-2 text-lg disabled:opacity-60">
          {loading ? <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><Zap size={20} fill="white" /><span>Pay NPR {price.toLocaleString()}</span></>}
        </motion.button>
      </div>
    </div>
  );
}
