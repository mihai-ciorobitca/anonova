import React, { useState, useEffect } from 'react';
import { Search, Users, UserPlus, Shield, User, Mail, Key, Eye, EyeOff, Loader, ArrowRight, Hash, Terminal, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import GlitchText from './GlitchText';
import NavigationButtons from './NavigationButtons';

const DemoPage = () => {
  const navigate = useNavigate();
  const { setVerificationEmail } = useAuth();
  const { credits, setCredits } = useUser();
  const [authState, setAuthState] = useState<'login' | 'register'>('register');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set verification email in context
      setVerificationEmail(email);
      
      // Redirect to verification page
      navigate('/verify-email');
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20 px-4 mt-16">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <NavigationButtons />
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto flex items-center justify-center">
          <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Form */}
            <div className="relative">
              {/* Animated glow effect */}
              <div className="absolute inset-0 bg-[#0F0]/20 blur-[100px] rounded-full animate-pulse" />
              
              <div className="relative">
                <div className="text-center md:text-left mb-8">
                  <GlitchText 
                    text={authState === 'login' ? 'Welcome Back' : 'Join the Network'}
                    className="text-4xl font-bold mb-4"
                  />
                  <p className="text-gray-400 text-lg">
                    {authState === 'login' 
                      ? 'Access the demo with your account'
                      : 'Create your account to start the demo'}
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    {authState === 'register' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="sr-only">First Name</label>
                          <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-[#0F0] transition-colors" />
                            <input
                              id="firstName"
                              name="firstName"
                              type="text"
                              required
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-10 text-white placeholder-gray-500 
                                focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all group-hover:border-[#0F0]/50"
                              placeholder="First Name"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="lastName" className="sr-only">Last Name</label>
                          <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-[#0F0] transition-colors" />
                            <input
                              id="lastName"
                              name="lastName"
                              type="text"
                              required
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-10 text-white placeholder-gray-500 
                                focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all group-hover:border-[#0F0]/50"
                              placeholder="Last Name"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="email" className="sr-only">Email address</label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-[#0F0] transition-colors" />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-10 text-white placeholder-gray-500 
                            focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all group-hover:border-[#0F0]/50"
                          placeholder="Email address"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="sr-only">Password</label>
                      <div className="relative group">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-[#0F0] transition-colors" />
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-10 text-white placeholder-gray-500 
                            focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all group-hover:border-[#0F0]/50"
                          placeholder="Password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0F0] transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full group"
                    disabled={loading || (authState === 'register' && (!firstName || !lastName))}
                  >
                    {loading ? (
                      <Loader className="h-5 w-5 animate-spin" />
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {authState === 'login' ? 'Sign in' : 'Create account'}
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthState(authState === 'login' ? 'register' : 'login');
                        setFirstName('');
                        setLastName('');
                      }}
                      className="text-[#0F0]/70 hover:text-[#0F0] transition-colors"
                    >
                      {authState === 'login' 
                        ? "Don't have an account? Sign up"
                        : 'Already have an account? Sign in'}
                    </button>
                  </div>
                </form>

                <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
                  <Shield className="w-4 h-4" />
                  Your data is protected with end-to-end encryption
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
                  <h3 className="text-2xl font-bold text-[#0F0] mb-2">Demo Features</h3>
                  <p className="text-gray-400">Experience our powerful extraction capabilities</p>
                </div>

                <div className="space-y-6">
                  {[
                    { icon: Zap, text: 'Extract up to 50 profiles in the demo' },
                    { icon: Shield, text: 'Military-grade encryption' },
                    { icon: Search, text: 'Profile and hashtag extraction' },
                    { icon: Users, text: 'Access follower and following data' }
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
    </div>
  );
};

export default DemoPage;
