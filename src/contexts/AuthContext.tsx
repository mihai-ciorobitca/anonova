import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
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
    const initializeAuth = async () => {
      setIsLoading(true);
      console.log('[Auth] Initializing auth...');

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const {
        data: userData,
      } = await supabase.auth.getUser();

      console.log('[Auth] Session:', session);
      console.log('[Auth] User from getUser:', userData?.user);

      const currentUser = session?.user ?? userData?.user ?? null;
      const isUserVerified = !!currentUser?.email_confirmed_at;

      console.log('[Auth] Resolved user:', currentUser);
      console.log('[Auth] Email verified:', isUserVerified);

      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setIsVerified(isUserVerified);
      setVerificationEmail(
        !isUserVerified && currentUser && currentUser.email ? currentUser.email : null
      );
      setIsLoading(false);
      console.log('[Auth] Auth state updated.');
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      const isUserVerified = !!currentUser?.email_confirmed_at;

      console.log(`[Auth] Auth state change: ${event}`);
      console.log('[Auth] Session:', session);
      console.log('[Auth] User:', currentUser);
      console.log('[Auth] Verified:', isUserVerified);

      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setIsVerified(isUserVerified);
      setVerificationEmail(
        !isUserVerified && currentUser && currentUser.email ? currentUser.email : null
      );

      if (!session) {
        console.log('[Auth] User signed out or session expired');
        setUser(null);
        setIsAuthenticated(false);
        setIsVerified(false);
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
            plan_id: planId || '',
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
      console.log('[Auth] Signing out...');

      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('[Auth] Supabase sign-out error:', error);
        // Proceed to clear local data even if Supabase sign-out fails
      } else {
        console.log('[Auth] Supabase sign-out successful.');
      }

      // Clear all auth states and local storage
      console.log('[Auth] Clearing local storage, session storage, and cookies...');
      clearAuthData();
      console.log('[Auth] Local data cleared.');

      setIsAuthenticated(false);
      setIsVerified(false);
      setUser(null);
      setVerificationEmail(null);

      console.log('[Auth] State reset. Waiting before redirecting to home...');

      // Wait for a short delay to ensure local storage is cleared
      setTimeout(() => {
        console.log('[Auth] Redirecting to home now.');
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error('[Auth] Sign-out failed:', error);

      // Ensure local data is cleared even if an error occurs
      console.log('[Auth] Clearing local storage, session storage, and cookies after error...');
      clearAuthData();
      console.log('[Auth] Local data cleared after error.');

      setIsAuthenticated(false);
      setIsVerified(false);
      setUser(null);
      setVerificationEmail(null);

      // Force reload to ensure clean state
      console.log('[Auth] Forcing reload to ensure clean state.');
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