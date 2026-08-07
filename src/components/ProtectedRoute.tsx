import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <LoadingSpinner size="lg" text="Loading PadhaiNepal..." />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
