import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  isAuthenticated: boolean;
  isVerified: boolean;
  isLoading: boolean;
  verificationEmail: string | null;
  user: User | null;
  setVerificationEmail: (email: string | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  setIsVerified: (value: boolean) => void;
  signUp: (email: string, password: string, firstName: string, lastName: string, planId?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export class AuthenticationError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check current auth status
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const isUserVerified = !!session?.user.email_confirmed_at;
      setIsAuthenticated(!!session);
      setIsVerified(isUserVerified);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // If user is authenticated but not verified, store their email
      if (session && !isUserVerified) {
        setVerificationEmail(session.user.email);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const isUserVerified = !!session?.user.email_confirmed_at;
      setIsAuthenticated(!!session);
      setIsVerified(isUserVerified);
      setUser(session?.user ?? null);

      // If user is authenticated but not verified, store their email
      if (session && !isUserVerified) {
        setVerificationEmail(session.user.email);
      }

      // Clear states on sign out
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setIsVerified(false);
        setUser(null);
        setVerificationEmail(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, planId?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            plan_id: planId,
            support_id: `ANV-${Date.now().toString(36).toUpperCase()}`
          },
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user data returned');

      // Set verification email and auth state
      setVerificationEmail(email);
      setUser(data.user);
      setIsAuthenticated(true);
      setIsVerified(false);

    } catch (error: any) {
      console.error('Sign up error:', error);
      
      if (error.message?.includes('already registered')) {
        throw new AuthenticationError('user_already_exists', 'An account with this email already exists. Please sign in instead.');
      }
      if (error.message?.includes('Password should be at least 6 characters')) {
        throw new AuthenticationError('weak_password', 'Password must be at least 6 characters long.');
      }
      
      throw new AuthenticationError('sign_up_failed', 'Failed to create account. Please try again.');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const isUserVerified = !!data.user.email_confirmed_at;
      setUser(data.user);
      setIsAuthenticated(true);
      setIsVerified(isUserVerified);
      setVerificationEmail(isUserVerified ? null : email);

      // Update last login if verified
      if (isUserVerified) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('Failed to update last login:', updateError);
        }
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new AuthenticationError('invalid_credentials', 'Invalid email or password. Please try again.');
    }
  };

  const clearAuthData = () => {
    // Clear all auth-related local storage items
    const keysToRemove = [
      'sb:token',
      'sb-access-token',
      'sb-refresh-token',
      'supabase.auth.token',
      'supabase.auth.refreshToken',
      'supabase.auth.user',
      'supabase.auth.expires',
      'sb-provider-token',
      'sb-provider-refresh-token',
      'supabase.auth.callbackUrl',
      'i18nextLng',
      'cookieConsent'
    ];

    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Clear session storage
    sessionStorage.clear();

    // Clear cookies
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};secure;samesite=strict`;
    }
  };

  const signOut = async () => {
    try {
      // Clear all storage and cookies first
      clearAuthData();

      // Sign out from Supabase with global scope
      const { error } = await supabase.auth.signOut({
        scope: 'global' // This ensures all sessions are terminated
      });
      
      if (error) throw error;

      // Clear Supabase session
      await supabase.auth.clearSession();
      
      // Clear all auth states
      setIsAuthenticated(false);
      setIsVerified(false);
      setUser(null);
      setVerificationEmail(null);

      // Force a complete page reload and redirect to home
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      
      // Even if there's an error, try to clear everything
      clearAuthData();
      setIsAuthenticated(false);
      setIsVerified(false);
      setUser(null);
      setVerificationEmail(null);

      // Force reload anyway to ensure clean state
      window.location.href = '/';

      throw new AuthenticationError('sign_out_failed', 'Failed to sign out. Please try again.');
    }
  };

  const resendVerificationEmail = async () => {
    if (!verificationEmail) {
      throw new AuthenticationError('no_email', 'No email address to verify');
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (error) throw error;
    } catch (error) {
      throw new AuthenticationError('resend_failed', 'Failed to resend verification email. Please try again.');
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isVerified,
      isLoading,
      verificationEmail,
      user,
      setVerificationEmail,
      setIsAuthenticated,
      setIsVerified,
      signUp,
      signIn,
      signOut,
      resendVerificationEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};