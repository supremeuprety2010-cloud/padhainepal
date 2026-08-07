import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, MessageCircle, ChevronLeft } from 'lucide-react';

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
  showActions?: boolean;
  back?: boolean;
  fallback?: string;          // where to go if no history
  onBack?: () => void;        // override back entirely
}

export default function AppHeader({
  title,
  showLogo = false,
  showActions = true,
  back = false,
  fallback = '/home',
  onBack,
}: AppHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    if (window.history.length > 1) navigate(-1);
    else navigate(fallback, { replace: true });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">

        {/* Left slot */}
        {back ? (
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-700 active:bg-gray-200 transition-colors"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </motion.button>
        ) : showLogo ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="font-black text-gray-900 text-base">
              Padhai<span className="text-blue-600">Nepal</span>
            </span>
          </div>
        ) : (
          <div className="w-9" />
        )}

        {/* Centre title */}
        {title && (
          <h1 className="font-bold text-gray-900 text-base absolute left-1/2 -translate-x-1/2 pointer-events-none">
            {title}
          </h1>
        )}

        {/* Right slot */}
        {showActions ? (
          <div className="flex items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/doubts')}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600"
              title="Doubts"
            >
              <MessageCircle size={17} />
            </motion.button>
          </div>
        ) : (
          <div className="w-9" />
        )}
      </div>
    </header>
  );
}
