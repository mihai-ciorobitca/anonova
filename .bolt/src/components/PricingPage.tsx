import React, { useState } from 'react';
import { Shield, Zap, Building2, Check, Info, X, Mail, Key, User, Eye, EyeOff, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import NavigationButtons from './NavigationButtons';
import { useAuth } from '../contexts/AuthContext';

interface Plan {
  id: string;
  name: string;
  price: number | null;
  annualPrice?: number;
  pricePerCredit: number;
  minimumCredits: number;
  includedCredits?: number;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'b656d741-4e93-474a-81ee-373f3e1af15e', // Free Plan ID
    name: 'Free Plan',
    price: null,
    pricePerCredit: 0.03,
    minimumCredits: 500,
    features: [
      'Basic data extraction',
      'Export to CSV',
      'Email support',
      'Pay as you go',
      'No monthly fees',
    ],
  },
  {
    id: '4c8dfd01-a537-4038-87aa-5ed665e4a4fb', // Pro Plan ID
    name: 'Pro Plan',
    price: 50,
    annualPrice: 480,
    pricePerCredit: 0.02,
    minimumCredits: 2500,
    includedCredits: 2500,
    popular: true,
    features: [
      'Advanced data extraction',
      'All export formats',
      'Priority support',
      'Bulk extraction',
      'Ghost mode scraping',
    ],
  },
  {
    id: 'f224bb82-2ada-494b-9f04-75b5191f11a2', // Enterprise Plan ID
    name: 'Enterprise Plan',
    price: 99,
    annualPrice: 950,
    pricePerCredit: 0.01,
    minimumCredits: 25000,
    includedCredits: 10000,
    features: [
      'Unlimited data extraction',
      'Dedicated support',
      'Team collaboration',
      'Advanced analytics',
      'Volume discounts',
    ],
  },
];

const PricingPage = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedPlanInfo, setSelectedPlanInfo] = useState<Plan | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Auth form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleShowInfo = (plan: Plan) => {
    setSelectedPlanInfo(plan);
    setShowInfoModal(true);
  };

  const handleGetStarted = (plan: Plan) => {
    // Mock check if user is logged in
    const isLoggedIn = false; // This would come from your auth context/state

    if (isLoggedIn) {
      // If logged in, redirect to subscription page
      navigate('/dashboard/subscription');
    } else {
      // If not logged in, show auth modal
      setSelectedPlanInfo(plan);
      setShowAuthModal(true);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    if (!selectedPlanInfo) {
      setError('Please select a plan');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create account using Supabase auth with selected plan ID
      await signUp(email, password, firstName, lastName, selectedPlanInfo.id);
      
      // After successful signup, user will be redirected to verify email
      navigate('/verify-email');
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.message?.includes('already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getMinimumPurchaseInfo = (plan: Plan) => {
    if (plan.name === 'Free Plan') {
      return {
        title: 'Free Plan - Minimum Purchase',
        description: 'Minimum purchase of 500 credits required per order.',
        details: [
          'Each credit allows you to extract one contact',
          'Pay-as-you-go pricing at $0.03 per credit',
          'No subscription fee required',
        ]
      };
    }
    if (plan.name === 'Pro Plan') {
      return {
        title: 'Pro Plan - Credit Requirements',
        description: 'After using your subscription credits, you must purchase a minimum of 2,500 credits per order to maintain $0.02 per credit. Orders below this amount will be charged at $0.03 per credit.',
        details: [
          `Monthly subscription includes 2,500 credits (${billingCycle === 'annual' ? '30,000 annually' : '2,500 monthly'})`,
          'Additional credits at $0.02 each (minimum 2,500)',
          'Smaller orders possible at $0.03 per credit',
          'Automatic monthly credit renewal'
        ]
      };
    }
    if (plan.name === 'Enterprise Plan') {
      return {
        title: 'Enterprise Plan - Credit Requirements',
        description: 'After using your subscription credits, you must purchase a minimum of 25,000 credits per order to maintain $0.01 per credit. Orders below this amount will be charged at $0.02 per credit.',
        details: [
          `Monthly subscription includes 10,000 credits (${billingCycle === 'annual' ? '120,000 annually' : '10,000 monthly'})`,
          'Additional credits at $0.01 each (minimum 25,000)',
          'Medium orders available at $0.02 per credit',
          'Automatic monthly credit renewal',
          'Volume discounts available'
        ]
      };
    }
    return null;
  };

  const calculateMonthlyPrice = (plan: Plan) => {
    if (!plan.price) return null;
    if (billingCycle === 'monthly') return plan.price;
    if (billingCycle === 'annual' && plan.annualPrice) {
      return Math.round(plan.annualPrice / 12);
    }
    return plan.price;
  };

  const calculateYearlyPrice = (plan: Plan) => {
    if (!plan.price) return null;
    return billingCycle === 'annual' ? plan.annualPrice : plan.price * 12;
  };

  const calculateYearlySavings = (plan: Plan) => {
    if (!plan.price || !plan.annualPrice) return 0;
    return (plan.price * 12) - plan.annualPrice;
  };

  return (
    <div className="min-h-screen py-20 px-4 mt-16">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <NavigationButtons />
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0F0] mb-4">
            Choose Your Access Level
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Unlock the full potential of data extraction with our flexible plans
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center space-x-4 mb-16">
          <span className={`text-lg ${billingCycle === 'monthly' ? 'text-[#0F0]' : 'text-gray-400'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
            className="relative w-20 h-10 rounded-full bg-black border-2 border-[#0F0]/50 transition-colors duration-300 group"
          >
            <div
              className={`absolute top-1 w-8 h-8 rounded-full bg-[#0F0] transition-all duration-500 
                ${billingCycle === 'annual' ? 'left-10' : 'left-1'}
                before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full 
                before:bg-[#0F0]/30 before:rounded-full before:animate-pulse`}
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-lg ${billingCycle === 'annual' ? 'text-[#0F0]' : 'text-gray-400'}`}>
              Annual
            </span>
            <span className="text-sm text-[#0F0] font-bold">Save 20%</span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-black/40 backdrop-blur-sm border rounded-xl p-8 transition-all duration-300 ${
                plan.popular ? 'border-[#0F0] scale-105' : 'border-[#0F0]/20 hover:border-[#0F0]/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#0F0] text-black text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-[#0F0] mb-2">{plan.name}</h3>
                {plan.price ? (
                  <>
                    <div className="text-4xl font-bold text-white mb-2">
                      ${calculateMonthlyPrice(plan)}
                      <span className="text-lg text-gray-400">/month</span>
                    </div>
                    {billingCycle === 'annual' && plan.annualPrice && (
                      <div className="space-y-1">
                        <div className="text-sm text-[#0F0]">
                          ${calculateYearlyPrice(plan)} billed annually
                        </div>
                        <div className="text-sm text-[#0F0] font-bold">
                          Save ${calculateYearlySavings(plan)}/year
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-lg text-gray-400 mb-2">No Monthly Fee</div>
                )}
                {plan.includedCredits && (
                  <div className="text-lg text-[#0F0] mb-2">
                    Includes {billingCycle === 'annual' ? plan.includedCredits * 12 : plan.includedCredits} credits
                    <span className="text-sm text-gray-400">/{billingCycle === 'annual' ? 'year' : 'month'}</span>
                  </div>
                )}
                <div className="text-xl text-[#0F0]">
                  ${plan.pricePerCredit} per credit
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  1 credit = 1 contact
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-gray-300">
                    <Check className="w-4 h-4 text-[#0F0] mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-gray-400 text-sm">Minimum Purchase:</span>
                <span className="text-[#0F0] text-sm">{plan.minimumCredits.toLocaleString()} credits</span>
                <button
                  className="text-gray-400 hover:text-[#0F0] transition-colors"
                  onClick={() => handleShowInfo(plan)}
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <Button 
                className="w-full"
                onClick={() => handleGetStarted(plan)}
              >
                Get Started
              </Button>
            </div>
          ))}
        </div>

        {/* Trust Signals */}
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-lg p-6">
            <Shield className="w-12 h-12 text-[#0F0] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Military-Grade Encryption</h3>
            <p className="text-gray-400">Your data is protected with AES-256 encryption</p>
          </div>
          <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-lg p-6">
            <Zap className="w-12 h-12 text-[#0F0] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">AI-Powered Security</h3>
            <p className="text-gray-400">Advanced algorithms protect against detection</p>
          </div>
          <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-lg p-6">
            <Building2 className="w-12 h-12 text-[#0F0] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">99.9% Uptime</h3>
            <p className="text-gray-400">Enterprise-grade infrastructure reliability</p>
          </div>
        </div>

        {/* Info Modal */}
        {showInfoModal && selectedPlanInfo && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowInfoModal(false)}
            />
            
            {/* Modal */}
            <div className="relative bg-black/90 border border-[#0F0]/30 rounded-xl p-8 max-w-2xl w-full mx-4 transform transition-all">
              <button
                onClick={() => setShowInfoModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-[#0F0] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-[#0F0]">
                  {getMinimumPurchaseInfo(selectedPlanInfo)?.title}
                </h3>
                
                <p className="text-gray-300 text-lg leading-relaxed">
                  {getMinimumPurchaseInfo(selectedPlanInfo)?.description}
                </p>
                
                <div className="space-y-4 mt-6">
                  <h4 className="text-lg font-semibold text-[#0F0]">Key Details:</h4>
                  <ul className="space-y-3">
                    {getMinimumPurchaseInfo(selectedPlanInfo)?.details.map((detail, index) => (
                      <li key={index} className="flex items-center text-gray-300">
                        <Zap className="w-4 h-4 text-[#0F0] mr-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button
                  className="w-full mt-6"
                  onClick={() => setShowInfoModal(false)}
                >
                  Got it
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Auth Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowAuthModal(false)}
            />
            
            {/* Modal */}
            <div className="relative bg-black/90 border border-[#0F0]/30 rounded-xl p-8 max-w-md w-full mx-4">
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-[#0F0] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[#0F0] mb-4">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-400">
                  {isLogin 
                    ? 'Sign in to continue with your subscription'
                    : 'Register to start your subscription'}
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleAuthSubmit}>
                <div className="space-y-4">
                  {!isLogin && (
                    <>
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
                    </>
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
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center">{error}</div>
                )}

                {!isLogin && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="rounded border-gray-400 text-[#0F0] focus:ring-[#0F0]"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-400">
                      I agree to the terms and conditions
                    </label>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || (!isLogin && (!firstName || !lastName || !agreedToTerms))}
                >
                  {loading ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    isLogin ? 'Sign in' : 'Create account'
                  )}
                </Button>
              </form>

              <div className="text-center mt-6">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[#0F0]/70 hover:text-[#0F0] transition-colors"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingPage;
