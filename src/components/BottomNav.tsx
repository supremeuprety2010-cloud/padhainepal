import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, Users, User } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { to: '/home',      icon: Home,     label: 'Home'      },
  { to: '/study',     icon: BookOpen, label: 'Study'     },
  { to: '/community', icon: Users,    label: 'Community' },
  { to: '/profile',   icon: User,     label: 'Profile'   },
];

export default function BottomNav() {
  const location = useLocation();

  const isActive = (to: string) => {
    if (to === '/home') return location.pathname === '/home';
    return location.pathname.startsWith(to);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white/90 backdrop-blur-2xl border-t border-gray-100 shadow-2xl shadow-black/10">
        <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
          {tabs.map(({ to, icon: Icon, label }) => {
            const active = isActive(to);
            return (
              <NavLink key={to} to={to} className="flex-1">
                <motion.div
                  whileTap={{ scale: 0.82 }}
                  className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-2xl transition-all duration-200 min-h-[52px] justify-center ${
                    active ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute w-10 h-10 bg-blue-50 rounded-2xl -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                  <span className={`text-[10px] font-semibold tracking-tight ${
                    active ? 'text-blue-600' : 'text-gray-400'
                  }`}>{label}</span>
                </motion.div>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
