import { motion } from 'framer-motion';
import { Shield, Crown, Sparkles } from 'lucide-react';

interface AdminBadgeProps {
  userId?: string;
  role?: string;
  size?: 'sm' | 'md' | 'lg';
  showGlow?: boolean;
}

const ADMIN_USER_IDS = ['af8c2244-2be1-4032-8ba4-8cc46f06de5f'];

export function isAdminUser(userId?: string, role?: string): boolean {
  if (!userId && !role) return false;
  if (userId && ADMIN_USER_IDS.includes(userId)) return true;
  if (role === 'admin' || role === 'moderator') return true;
  return false;
}

export default function AdminBadge({ userId, role, size = 'sm', showGlow = true }: AdminBadgeProps) {
  if (!isAdminUser(userId, role)) return null;

  const isSuperadmin = userId === 'af8c2244-2be1-4032-8ba4-8cc46f06de5f';

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  const iconSize = size === 'sm' ? 10 : size === 'md' ? 12 : 15;

  return (
    <div className="relative inline-flex items-center">
      {/* Outer Glow */}
      {showGlow && (
        <motion.div
          animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.98, 1.05, 0.98] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute inset-0 bg-gradient-to-r from-amber-400 via-emerald-400 to-yellow-500 rounded-full blur-xs shadow-md shadow-amber-400/50"
        />
      )}

      {/* Badge Content */}
      <span className={`relative inline-flex items-center rounded-full font-black tracking-wider uppercase bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 border border-amber-200/80 shadow-md ${sizeClasses}`}>
        {isSuperadmin ? <Crown size={iconSize} className="fill-slate-950" /> : <Shield size={iconSize} className="fill-slate-950" />}
        <span>{isSuperadmin ? 'ADMIN' : 'ADMIN'}</span>
        <Sparkles size={iconSize - 2} className="text-amber-950" />
      </span>
    </div>
  );
}
