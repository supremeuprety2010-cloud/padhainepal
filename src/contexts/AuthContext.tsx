import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import supabase from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  grade: number;
  stream: string | null;
  subjects: string[];
  school_id: string | null;
  school_name: string | null;
  district: string | null;
  province: string | null;
  avatar_url: string | null;
  avatar_color: string | null;
  bio: string | null;
  role?: string;
  is_admin?: boolean;
  instagram_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
  xp_points: number;
  streak_count: number;
  trial_start: string | null;
  onboarding_complete: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, profile: null, isAdmin: false, loading: true, refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/profile/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) setProfile(data as UserProfile);
      }
    } catch (e) {
      try {
        const res2 = await fetch(`/api/profile?user_id=${userId}`);
        if (res2.ok) { const d = await res2.json(); if (d) setProfile(d); }
      } catch {}
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false));
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = Boolean(
    user?.id === 'af8c2244-2be1-4032-8ba4-8cc46f06de5f' ||
    profile?.role === 'admin' ||
    profile?.is_admin === true
  );

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
