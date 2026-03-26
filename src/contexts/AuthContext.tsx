import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabase from '../supabaseClient';

interface Profile {
  id: string;
  full_name?: string;
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

  // Load user profile whenever the session changes.
  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (!error && data) {
          setUser(data as Profile);
        }
      } else {
        setUser(null);
      }
    };
    if (session) {
      fetchProfile();
    }
  }, [session]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, profile: Partial<Profile>) => {
    // Sign up with email/password
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return { error: error as Error };
    }
    // insert profile row
    const userId = data?.user?.id;
    if (userId) {
      const { error: profileErr } = await supabase.from('profiles').insert({ id: userId, email, ...profile });
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