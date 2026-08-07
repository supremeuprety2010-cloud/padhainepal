import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  color?: string;
  onClick?: () => void;
}

export default function StatCard({ icon, value, label, color = 'bg-blue-50', onClick }: StatCardProps) {
  return (
    <motion.div whileTap={onClick ? { scale: 0.95 } : undefined} onClick={onClick}
      className={`${color} rounded-2xl p-3.5 flex flex-col gap-2 ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="text-2xl">{icon}</div>
      <div>
        <p className="text-xl font-black text-gray-800 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}
