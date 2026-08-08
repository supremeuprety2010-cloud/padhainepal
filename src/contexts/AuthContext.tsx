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
  updateLocalProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, profile: null, isAdmin: false, loading: true, refreshProfile: async () => {}, updateLocalProfile: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (u: User) => {
    const userId = u.id;
    const email = u.email;

    try {
      const queryParams = new URLSearchParams();
      if (userId) queryParams.set('user_id', userId);
      if (email) queryParams.set('email', email);

      const res = await fetch(`/api/profile?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error && (data.id || data.full_name)) {
          // If the profile has saved info (full_name, grade, subjects), mark onboarding_complete
          const hasSavedInfo = Boolean(
            data.onboarding_complete ||
            data.grade ||
            (data.subjects && data.subjects.length > 0) ||
            (data.full_name && data.full_name !== 'Student')
          );

          setProfile({
            ...data,
            onboarding_complete: hasSavedInfo,
          } as UserProfile);
          return;
        }
      }
    } catch (e) {
      console.error('Fetch profile error:', e);
    }

    // Default fallback profile for new users or if profile row is not created yet
    const fallbackProfile: UserProfile = {
      id: userId,
      full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Student',
      phone: u.phone || '',
      grade: 10,
      stream: null,
      subjects: [],
      school_id: null,
      school_name: null,
      district: null,
      province: null,
      avatar_url: u.user_metadata?.avatar_url || null,
      avatar_color: 'from-blue-500 to-indigo-600',
      bio: null,
      instagram_url: null,
      facebook_url: null,
      linkedin_url: null,
      twitter_url: null,
      youtube_url: null,
      website_url: null,
      xp_points: 0,
      streak_count: 0,
      trial_start: new Date().toISOString(),
      onboarding_complete: false,
    };

    setProfile(fallbackProfile);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  const updateLocalProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      if (!prev && user) {
        return {
          id: user.id,
          full_name: 'Student',
          phone: '',
          grade: 10,
          stream: null,
          subjects: [],
          school_id: null,
          school_name: null,
          district: null,
          province: null,
          avatar_url: null,
          avatar_color: 'from-blue-500 to-indigo-600',
          bio: null,
          instagram_url: null,
          facebook_url: null,
          linkedin_url: null,
          twitter_url: null,
          youtube_url: null,
          website_url: null,
          xp_points: 0,
          streak_count: 0,
          trial_start: new Date().toISOString(),
          onboarding_complete: true,
          ...updates,
        } as UserProfile;
      }
      return prev ? { ...prev, ...updates, onboarding_complete: true } as UserProfile : null;
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = Boolean(
    user?.id === 'af8c2244-2be1-4032-8ba4-8cc46f06de5f' ||
    profile?.role === 'admin' ||
    profile?.is_admin === true
  );

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, loading, refreshProfile, updateLocalProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
