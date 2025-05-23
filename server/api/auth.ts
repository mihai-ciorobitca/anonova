import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import express from 'express';

const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName
      }
    }
  });

  if (authError) throw authError;
  return authData;
};

export const signIn = async (email: string, password: string) => {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) throw authError;

  // Update last login
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', authData.user.id);

  return authData;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut({
    scope: 'local'
  });
  if (error) throw error;
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};

export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

const router = express.Router();

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    await resetPassword(email);
    res.status(200).json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to send password reset email' });
  }
});

export default router;