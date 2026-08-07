import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  // Consider onboarding complete if:
  // 1. onboarding_complete flag is true, OR
  // 2. profile has grade + at least one subject (means they've been through onboarding before)
  const isComplete =
    profile?.onboarding_complete === true ||
    (profile?.grade != null && (profile?.subjects?.length ?? 0) > 0);

  if (!isComplete) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}
