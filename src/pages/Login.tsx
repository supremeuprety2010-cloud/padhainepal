import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Phone, Eye, EyeOff, ArrowRight, BookOpen, ChevronLeft } from 'lucide-react';
import supabase from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        navigate('/onboarding');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+977${phone}`;
      if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
        if (error) throw error;
        setOtpSent(true);
      } else {
        const { error } = await supabase.auth.verifyOtp({ phone: formattedPhone, token: otp, type: 'sms' });
        if (error) throw error;
        navigate('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex flex-col relative">
      {/* Back Button to Landing Page */}
      <div className="absolute top-6 left-6 z-20">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border border-white/20 shadow-lg"
        >
          <ChevronLeft size={16} strokeWidth={2.5} /> Back to Home
        </motion.button>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-1">PadhaiNepal</h1>
          <p className="text-blue-200 text-sm">Nepal's #1 EdTech for Grade 8–12</p>
        </motion.div>

        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="w-full max-w-sm">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
            {/* Mode Toggle */}
            <div className="flex bg-white/10 rounded-2xl p-1 mb-6">
              {(['login', 'signup'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === m ? 'bg-white text-blue-700 shadow' : 'text-white/70'}`}>
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Auth Method Toggle */}
            <div className="flex gap-2 mb-4">
              {(['email', 'phone'] as const).map(m => (
                <button key={m} onClick={() => { setAuthMethod(m); setOtpSent(false); setError(''); }} className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${authMethod === m ? 'bg-white/20 border-white/40 text-white' : 'border-white/10 text-white/50'}`}>
                  {m === 'email' ? '✉️ Email' : '📱 Phone OTP'}
                </button>
              ))}
            </div>

            {error && <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm rounded-xl px-3 py-2 mb-4">{error}</div>}

            {authMethod === 'email' ? (
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                  <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/50" />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                  <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-10 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/50" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading} className="w-full bg-white text-blue-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-60">
                  {loading ? <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin" /> : <><span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span><ArrowRight size={16} /></>}
                </motion.button>
              </form>
            ) : (
              <form onSubmit={handlePhoneOTP} className="space-y-3">
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                  <input type="tel" placeholder="98XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} required disabled={otpSent} className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/50 disabled:opacity-50" />
                </div>
                {otpSent && (
                  <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm text-center tracking-widest focus:outline-none focus:border-white/50" />
                )}
                <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading} className="w-full bg-white text-blue-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-60">
                  {loading ? <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin" /> : <span>{otpSent ? 'Verify OTP' : 'Send OTP'}</span>}
                </motion.button>
                {otpSent && <button type="button" onClick={() => setOtpSent(false)} className="w-full text-white/60 text-xs py-1">← Change number</button>}
              </form>
            )}

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/40 text-xs">or</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={() => signInWithGoogle('PadhaiNepal')} className="w-full bg-white/10 border border-white/20 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </motion.button>
          </div>

          <p className="text-center text-white/50 text-xs mt-4">By continuing, you agree to our Terms & Privacy Policy</p>
          <p className="text-center text-white/60 text-xs mt-2">🇳🇵 Made for Nepal students</p>
        </motion.div>
      </div>
    </div>
  );
}
