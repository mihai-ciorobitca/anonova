import React, { useState } from 'react';
import { Search, Users, UserPlus, Shield, User, Mail, Key, Eye, EyeOff, Loader, ArrowRight, Hash, Terminal, Zap, Database, AlertCircle, CreditCard, Check, Lock, Globe, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import GlitchText from './GlitchText';
import LegalNotices from './LegalNotices';
import { useAuth, AuthenticationError } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import NavigationButtons from './NavigationButtons';
import { runApifyExtraction, type ExtractedData } from '../lib/apify';

type Platform = 'instagram' | 'linkedin' | 'facebook' | 'twitter';

interface ExtractionConfig {
  isHashtagMode: boolean;
  profileUrl: string;
  hashtag: string;
  state?: string;
  country: string;
  language: string;
  maxResults: number;
  maxLeadsPerInput?: number;
  extractFollowers: boolean;
  extractFollowing: boolean;
  creditsToUse: number;
  platform: Platform;
}

interface ExtractionResult {
  status: 'completed' | 'failed';
  data: ExtractedData[];
  error?: string;
}

const platforms = [
  {
    id: 'instagram' as Platform,
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-500',
    description: 'Extract data from Instagram profiles and hashtags',
    features: ['Profile followers', 'Profile following', 'Hashtag data']
  },
  {
    id: 'linkedin' as Platform,
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'text-blue-500',
    description: 'Extract professional network data',
    features: ['Profile connections', 'Company employees', 'Job postings']
  },
  {
    id: 'facebook' as Platform,
    name: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    description: 'Extract Facebook profiles and groups',
    features: ['Profile friends', 'Group members', 'Page followers']
  },
  {
    id: 'twitter' as Platform,
    name: 'X/Twitter',
    icon: Twitter,
    color: 'text-gray-200',
    description: 'Extract Twitter followers and engagement',
    features: ['Profile followers', 'Tweet engagement', 'Hashtag analysis']
  }
];

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast Extraction',
    description: 'Extract thousands of profiles in minutes with our optimized algorithms.',
    color: 'text-yellow-400'
  },
  {
    icon: Shield,
    title: 'Military-Grade Security',
    description: 'Advanced encryption protocols protect your data and maintain anonymity during extraction.',
    color: 'text-emerald-400'
  },
  {
    icon: Database,
    title: 'Ghost Mode Scraping',
    description: 'Undetectable extraction methods ensure your activities remain completely private.',
    color: 'text-purple-400'
  }
];

const StartScrapingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isVerified, signUp, signIn, setVerificationEmail } = useAuth();
  const { credits, hasUsedFreeCredits } = useUser();
  const [authState, setAuthState] = useState<'login' | 'register'>('register');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const [extractionConfig, setExtractionConfig] = useState<ExtractionConfig>({
    isHashtagMode: false,
    profileUrl: '',
    hashtag: '',
    state: '',
    country: 'us',
    language: 'en',
    maxResults: 10,
    maxLeadsPerInput: 100,
    extractFollowers: true,
    extractFollowing: false,
    creditsToUse: hasUsedFreeCredits ? 500 : 1,
    platform: 'instagram'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (authState === 'register') {
        await signUp(email, password, firstName, lastName);
        // After successful signup, user needs to verify email
        navigate('/verify-email');
      } else {
        await signIn(email, password);
        if (!isVerified) {
          navigate('/verify-email');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      if (error instanceof AuthenticationError) {
        setError(error.message);
        if (error.code === 'user_already_exists') {
          setAuthState('login');
          setPassword('');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartExtraction = async () => {
    const keyword = extractionConfig.isHashtagMode ? extractionConfig.hashtag : extractionConfig.profileUrl;
    
    if (!keyword || keyword.trim() === '') {
      setError('Please enter a valid ' + (extractionConfig.isHashtagMode ? 'hashtag' : 'profile URL'));
      return;
    }

    setIsExtracting(true);
    setError('');
    setExtractionResult(null);
    let retryCount = 0;
    const maxRetries = 3;

    const attemptExtraction = async (): Promise<ExtractedData[]> => {
      try {
        return await runApifyExtraction({
          keyword,
          country: extractionConfig.country,
          language: extractionConfig.language,
          maxLeads: extractionConfig.maxLeadsPerInput || extractionConfig.maxResults,
          proxyConfiguration: {
            useApifyProxy: true
          }
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('timed out') && retryCount < maxRetries) {
          retryCount++;
          console.log(`Retry attempt ${retryCount}/${maxRetries}`);
          return attemptExtraction();
        }
        throw error;
      }
    };

    try {
      const results = await attemptExtraction();
      setExtractionResult({
        status: 'completed',
        data: results
      });
    } catch (err) {
      console.error('Extraction error:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to extract data. Please try again.';

      setExtractionResult({
        status: 'failed',
        data: [],
        error: errorMessage
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="min-h-screen py-20 px-4 mt-16">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <NavigationButtons />
        </div>

        {/* Header */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-[#0F0]/20 blur-[100px] rounded-full animate-pulse" />
          <div className="relative">
            <GlitchText 
              text={isAuthenticated ? "Start Extraction" : "Join the Network"}
              className="text-4xl md:text-5xl font-bold mb-4"
            />
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">
              {isAuthenticated 
                ? "Configure your extraction settings and start gathering data"
                : "Create your account to start extracting data with military-grade security"}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left Column - Auth Form or Extraction Form */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#0F0]/20 blur-[100px] rounded-full animate-pulse" />
            
            <div className="relative bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-8">
              {!isAuthenticated ? (
                <>
                  <div className="text-center mb-8">
                    <Terminal className="w-16 h-16 text-[#0F0] mx-auto mb-4 animate-[float_4s_ease-in-out_infinite]" />
                    <h3 className="text-2xl font-bold text-[#0F0] mb-2">
                      {authState === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h3>
                    <p className="text-gray-400">
                      {authState === 'login' 
                        ? 'Sign in to start extracting data'
                        : 'Register to access advanced extraction features'}
                    </p>
                  </div>

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                      </div>
                    )}

                    {authState === 'register' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="sr-only">First Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              id="firstName"
                              name="firstName"
                              type="text"
                              required
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-10 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                              placeholder="First Name"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="lastName" className="sr-only">Last Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              id="lastName"
                              name="lastName"
                              type="text"
                              required
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-10 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                              placeholder="Last Name"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="email" className="sr-only">Email address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-10 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                          placeholder="Email address"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="sr-only">Password</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-10 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
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

                    {authState === 'register' && (
                      <LegalNotices 
                        type="extraction"
                        checked={agreedToTerms}
                        onChange={setAgreedToTerms}
                      />
                    )}

                    <Button
                      type="submit"
                      className="w-full group"
                      disabled={loading || (authState === 'register' && (!agreedToTerms || !firstName || !lastName))}
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
                          setError('');
                        }}
                        className="text-[#0F0]/70 hover:text-[#0F0] transition-colors"
                      >
                        {authState === 'login' 
                          ? "Don't have an account? Sign up"
                          : 'Already have an account? Sign in'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div className="space-y-6">
                    {/* Platform Selection */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Select Platform</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {platforms.map((platform) => (
                          <button
                            key={platform.id}
                            onClick={() => setExtractionConfig(prev => ({ ...prev, platform: platform.id }))}
                            className={`flex flex-col items-center gap-3 p-4 rounded-lg border transition-all ${
                              extractionConfig.platform === platform.id
                                ? 'border-[#0F0] bg-[#0F0]/10'
                                : 'border-gray-700 hover:border-[#0F0]/50'
                            }`}
                          >
                            <platform.icon className={`w-8 h-8 ${platform.color}`} />
                            <span className="text-sm font-medium">{platform.name}</span>
                          </button>
                        ))}
                      </div>
                      
                      {/* Instagram-specific extraction mode */}

                      <div className="mt-4 p-4 border border-[#0F0]/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-[#0F0]" />
                          <span className="text-sm text-[#0F0]">Platform Features</span>
                        </div>
                        <ul className="space-y-1">
                          {platforms.find(p => p.id === extractionConfig.platform)?.features.map((feature, index) => (
                            <li key={index} className="text-sm text-gray-400 flex items-center gap-2">
                              <div className="w-1 h-1 bg-[#0F0] rounded-full" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Target</label>
                      <input
                        type="text"
                        value={extractionConfig.hashtag}
                        onChange={(e) => setExtractionConfig(prev => ({ ...prev, hashtag: e.target.value }))}
                        className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                        placeholder="Enter a Hashtag"
                      />
                    </div>

                    {extractionConfig.platform !== 'linkedin' && (
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">State</label>
                        <input
                          type="text"
                          value={extractionConfig.state || ''}
                          onChange={(e) => setExtractionConfig(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                          placeholder="Enter a State"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Max Leads per Input</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={extractionConfig.maxLeadsPerInput || 100}
                          onChange={(e) => setExtractionConfig(prev => ({ 
                            ...prev, 
                            maxLeadsPerInput: Math.max(100, parseInt(e.target.value) || 100)
                          }))}
                          min="100"
                          className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                          placeholder="100"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          leads
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">Minimum 100 leads per input</p>
                    </div>

                    {/* LinkedIn-specific fields */}
                    {extractionConfig.platform === 'linkedin' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Country</label>
                          <select
                            value={extractionConfig.country}
                            onChange={(e) => setExtractionConfig(prev => ({ ...prev, country: e.target.value }))}
                            className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                          >
                            <option value="us">United States</option>
                            <option value="gb">United Kingdom</option>
                            <option value="ca">Canada</option>
                            <option value="au">Australia</option>
                            <option value="de">Germany</option>
                            <option value="fr">France</option>
                            <option value="es">Spain</option>
                            <option value="it">Italy</option>
                            <option value="nl">Netherlands</option>
                            <option value="se">Sweden</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Language</label>
                          <select
                            value={extractionConfig.language}
                            onChange={(e) => setExtractionConfig(prev => ({ ...prev, language: e.target.value }))}
                            className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="it">Italian</option>
                            <option value="nl">Dutch</option>
                            <option value="sv">Swedish</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Max Leads per Input</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={extractionConfig.maxLeadsPerInput || 10}
                              onChange={(e) => setExtractionConfig(prev => ({ 
                                ...prev, 
                                maxLeadsPerInput: e.target.value === '' ? undefined : parseInt(e.target.value)
                              }))}
                              min="1"
                              max="100"
                              className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                              placeholder="10"
                              onBlur={(e) => {
                                const value = parseInt(e.target.value);
                                if (!isNaN(value)) {
                                  setExtractionConfig(prev => ({
                                    ...prev,
                                    maxLeadsPerInput: Math.max(1, Math.min(value, 100))
                                  }));
                                }
                              }}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                              leads
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-gray-400">Maximum 100 leads per input</p>
                        </div>
                      </div>
                    )}

                    <Button 
                      className="w-full"
                      onClick={handleStartExtraction}
                      disabled={isExtracting || (!extractionConfig.hashtag && !extractionConfig.profileUrl)}
                    >
                      {isExtracting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-5 h-5 animate-spin" />
                          EXTRACTING_DATA.exe
                        </span>
                      ) : (
                        'START_EXTRACTION.exe'
                      )}
                    </Button>

                    {/* Extraction Results */}
                    {extractionResult && (
                      <div className="mt-8 -mx-8 px-8 py-6 border-t border-[#0F0]/20">
                        <h3 className="text-xl font-bold text-[#0F0] mb-4">
                          Extraction Results
                          {extractionResult.status === 'completed' && (
                            <span className="text-sm font-normal text-gray-400 ml-2">
                              ({extractionResult.data.length} records found)
                            </span>
                          )}
                        </h3>

                        {extractionResult.status === 'failed' ? (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            {extractionResult.error}
                          </div>
                        ) : extractionResult.data.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-[#0F0]/20">
                                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Lead</th>
                                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Username</th>
                                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Profile Link</th>
                                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Emails</th>
                                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Phones</th>
                                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Summary</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#0F0]/10">
                                {extractionResult.data.map((item, index) => (
                                  <tr key={index} className="hover:bg-[#0F0]/5 transition-colors">
                                    <td className="px-6 py-4">{item.lead || '-'}</td>
                                    <td className="px-6 py-4">{item.username || '-'}</td>
                                    <td className="px-6 py-4">
                                      <a 
                                        className="text-[#0F0] hover:underline"
                                        href={item.userLink}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          window.open(item.userLink, '_blank', 'noopener,noreferrer');
                                        }}
                                        target="_blank"
                                        rel="noopener noreferrer" 
                                      >
                                        {item.username || item.userLink.split('/').pop() || 'View Profile'}
                                      </a>
                                    </td>
                                    <td className="px-6 py-4">
                                      {item.emails.length > 0 ? (
                                        <div className="space-y-1">
                                          {item.emails.map((email, i) => ( 
                                            <a
                                              key={i}
                                              href={`mailto:${email}`}
                                              className="text-[#0F0] hover:underline block"
                                            >
                                              {email}
                                            </a>
                                          ))}
                                        </div>
                                      ) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                      {item.phones.length > 0 ? (
                                        <div className="space-y-1">
                                          {item.phones.map((phone, i) => (
                                            <a
                                              key={i}
                                              href={`tel:${phone}`}
                                              className="text-[#0F0] hover:underline block"
                                            >
                                              {phone}
                                            </a>
                                          ))}
                                        </div>
                                      ) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="max-w-xs truncate" title={item.summary}>
                                        {item.summary || '-'}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            No results found for your search criteria
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Features */}
          <div className="space-y-8">
            <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-8">
              <h3 className="text-xl font-bold text-[#0F0] mb-6">Extraction Features</h3>
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-4 border border-[#0F0]/20 rounded-lg hover:border-[#0F0]/50 transition-all group"
                  >
                    <feature.icon className={`w-8 h-8 ${feature.color} transform group-hover:scale-110 transition-transform`} />
                    <div>
                      <h4 className="font-semibold mb-1">{feature.title}</h4>
                      <p className="text-gray-400 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-8">
              <h3 className="text-xl font-bold text-[#0F0] mb-6">Security Features</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#0F0]" />
                  <span>Ghost mode extraction for undetectable operation</span>
                </div>
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-[#0F0]" />
                  <span>Military-grade encryption (AES-256)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[#0F0]" />
                  <span>Automatic IP rotation across global proxy network</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#0F0]" />
                  <span>Smart rate limiting to prevent detection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartScrapingPage;