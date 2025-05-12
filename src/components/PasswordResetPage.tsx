import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import {Loader} from 'lucide-react';

const PasswordResetPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetCode = urlParams.get('code');
    if (resetCode) {
      setCode(resetCode);
    } else {
      setError('Invalid or missing reset code.');
    }
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        throw error;
      }
      setSuccess('Password has been reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/dashboard'), 3000); 
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handlePasswordReset} className="space-y-6 w-full max-w-md">
        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500">
            {success}
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="new-password" className="sr-only">New Password</label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={!code || loading}
            className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
            placeholder="Enter your new password"
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={!code || loading}
        >
          {loading ? (
            <Loader className="h-5 w-5 animate-spin" />
          ) : (
            'Reset Password'
          )}
        </Button>
      </form>
    </div>
  );
};

export default PasswordResetPage;
