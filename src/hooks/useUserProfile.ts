import { useAuth } from '../contexts/AuthContext';
export function useUserProfile() {
  const { profile, refreshProfile, user, loading } = useAuth();
  return { profile, refreshProfile, user, loading };
}
