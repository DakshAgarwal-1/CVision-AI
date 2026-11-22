import { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type AuthError = {
  message: string;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
      if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
      }
      setSession(newSession ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;

  const clearPasswordRecovery = useCallback(() => {
    setIsPasswordRecovery(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    if (result.data.user && result.data.session && !result.error) {
      await supabase.from('profile').insert({
        user_id: result.data.user.id,
        name: fullName,
        title: '',
        cv_score: 0,
        email,
      });
    }
    return result;
  };

  const signOut = async () => {
    return supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    });
  };

  return {
    session,
    user,
    loading,
    isPasswordRecovery,
    clearPasswordRecovery,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
