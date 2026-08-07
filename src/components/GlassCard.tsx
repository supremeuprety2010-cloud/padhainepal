import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export default function GlassCard({ children, className = '', onClick, hover = false }: GlassCardProps) {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.97 } : undefined}
      whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
      onClick={onClick}
      className={`bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-lg shadow-blue-500/5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}
