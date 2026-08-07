import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  fallback?: string;
  className?: string;
  light?: boolean; // white text (for dark headers)
}

export default function BackButton({ fallback = '/home', className = '', light = false }: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(fallback, { replace: true });
  };

  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={handleBack}
      className={`flex items-center gap-1 font-medium transition-colors ${
        light ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'
      } ${className}`}
    >
      <ChevronLeft size={18} strokeWidth={2.5} />
      <span className="text-sm">Back</span>
    </motion.button>
  );
}
