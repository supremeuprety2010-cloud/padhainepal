import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useXP() {
  const { user, refreshProfile } = useAuth();

  const awardXP = useCallback(async (amount: number, reason?: string) => {
    if (!user) return;
    try {
      await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount, reason }),
      });
      await refreshProfile();
    } catch (e) {
      console.error('XP award error:', e);
    }
  }, [user, refreshProfile]);

  return { awardXP };
}
