import React, { useState, useEffect } from 'react';
import { Mail, Loader, ArrowRight, Shield, Terminal, RefreshCw, Check, Bug } from 'lucide-react';
import Button from './Button';
import GlitchText from './GlitchText';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const VerifyEmail = () => {
  const { verificationEmail, setIsVerified, setIsAuthenticated, resendVerificationEmail } = useAuth();
  const { setCredits, setHasUsedFreeCredits } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check URL for Supabase auth callback
    const checkEmailVerification = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session?.user.email_confirmed_at) {
        setIsAuthenticated(true);
        setIsVerified(true);
        setCredits(50); // Give 50 free credits
        setHasUsedFreeCredits(false);
        navigate('/dashboard');
      } else if (!verificationEmail) {
        // If no verification email is set and user is not verified, redirect to login
        navigate('/start-scraping');
      }
    };

    checkEmailVerification();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    setError('');
    try {
      await resendVerificationEmail();
      setResendTimer(60);
      setError('Verification email resent! Please check your inbox.');
    } catch (error) {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Remove the dev bypass function
  if (!verificationEmail) {
    return null;
  }

  return (
    <div className="min-h-screen py-20 px-4 mt-16">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Verification Form */}
          <div className="relative">
            {/* Animated glow effect */}
            <div className="absolute inset-0 bg-[#0F0]/20 blur-[100px] rounded-full animate-pulse" />
            
            <div className="relative">
              <div className="text-center md:text-left mb-8">
                <GlitchText 
                  text="Verify Your Email"
                  className="text-4xl font-bold mb-4"
                />
                <p className="text-gray-400 text-lg">
                  We've sent a verification email to:
                  <br />
                  <span className="text-[#0F0] font-mono">{verificationEmail}</span>
                </p>
                <p className="text-[#0F0] text-sm mt-2">
                  Complete verification to receive your 50 free credits!
                </p>
              </div>

              <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-8">
                <div className="space-y-6">
                  {/* Success Message */}
                  {error && error.includes('sent') && (
                    <div className="flex items-center gap-2 text-[#0F0] bg-[#0F0]/10 p-4 rounded-lg">
                      <Check className="w-5 h-5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="text-center">
                    <button
                      onClick={handleResendCode}
                      disabled={loading || resendTimer > 0}
                      className={`flex items-center gap-2 mx-auto transition-colors ${
                        resendTimer > 0 
                          ? 'text-gray-500 cursor-not-allowed' 
                          : 'text-[#0F0]/70 hover:text-[#0F0]'
                      }`}
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      {resendTimer > 0 
                        ? `Resend code in ${resendTimer}s` 
                        : 'Resend verification email'}
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
                  <Shield className="w-4 h-4" />
                  Check your email inbox and spam folder for the verification link
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Features */}
          <div className="hidden md:block relative">
            {/* Animated glow effect */}
            <div className="absolute inset-0 bg-[#0F0]/20 blur-[100px] rounded-full animate-pulse" />
            
            <div className="relative space-y-8">
              <div className="text-center">
                <Terminal className="w-16 h-16 text-[#0F0] mx-auto mb-4 animate-[float_4s_ease-in-out_infinite]" />
                <h3 className="text-2xl font-bold text-[#0F0] mb-2">Almost There!</h3>
                <p className="text-gray-400">Verify your email to unlock all features</p>
              </div>

              <div className="space-y-6">
                {[
                  { icon: Shield, text: 'Military-grade encryption for your data' },
                  { icon: Mail, text: 'Instant email notifications for extractions' },
                  { icon: Terminal, text: 'Access to advanced extraction features' }
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 p-4 border border-[#0F0]/20 rounded-lg bg-black/40 backdrop-blur-sm
                      hover:border-[#0F0]/50 transition-all group"
                  >
                    <feature.icon className="w-8 h-8 text-[#0F0] transform group-hover:scale-110 transition-transform" />
                    <span className="text-gray-300 group-hover:text-white transition-colors">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
