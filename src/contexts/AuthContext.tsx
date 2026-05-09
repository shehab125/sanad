import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import supabase from '../supabaseClient';

interface Profile {
  id: string;
  full_name?: string;
  username?: string;
  email: string;
  phone?: string;
  university?: string;
  faculty?: string;
  avatar_url?: string;
  role?: string;
}

interface AuthContextType {
  session: Session | null;
  user: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, profile: Partial<Profile>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialise session from Supabase.
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    init();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ملف المستخدم: نملأ بياناتًا أولية من الجلسة فورًا حتى لا تبقى user=null بعد تسجيل الدخول
  // (كان يسبب إعادة توجيه مستمرة إلى /login أو صفحة دفع فارغة).
  useEffect(() => {
    if (!session?.user) {
      setUser(null);
      return;
    }
    const minimal: Profile = {
      id: session.user.id,
      email: session.user.email || '',
      full_name: (session.user.user_metadata?.full_name as string | undefined) || undefined,
      username: (session.user.user_metadata?.username as string | undefined) || undefined,
    };
    setUser(minimal);

    let cancelled = false;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (!cancelled && data) {
        setUser(data as Profile);
      }
    };
    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, profile: Partial<Profile>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: profile.full_name,
          username: profile.username,
          university: profile.university,
          faculty: profile.faculty,
        },
      },
    });
    if (error) {
      return { error: error as Error };
    }
    const userId = data?.user?.id;
    if (userId) {
      const row: Record<string, unknown> = {
        id: userId,
        full_name: profile.full_name ?? null,
        username: profile.username ?? null,
      };
      if (profile.avatar_url) row.avatar_url = profile.avatar_url;

      const { error: profileErr } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
      if (profileErr) {
        return { error: profileErr as Error };
      }
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (profile: Partial<Profile>) => {
    if (!session?.user) return { error: new Error('Not logged in') };
    const updates = { ...profile, id: session.user.id };
    const { error } = await supabase.from('profiles').update(updates).eq('id', session.user.id);
    if (!error) {
      // refresh user profile
      setUser((prev) => ({ ...(prev as Profile), ...profile }));
    }
    return { error: error as Error | null };
  };

  const value: AuthContextType = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};