import React, { useState, useEffect } from 'react';
import { CreditCard, Shield, Zap, Clock, Calendar, Check, X, Info } from 'lucide-react';
import Button from '../Button';
import GlitchText from '../GlitchText';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import LegalNotices from '../LegalNotices';

interface Plan {
  name: string;
  price: number | null;
  annualPrice?: number;
  pricePerCredit: number;
  minimumCredits: number;
  includedCredits?: number;
  popular?: boolean;
  features: string[];
}

const MySubscription = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [currentSubscription, setCurrentSubscription] = useState<{
    plan: Plan | null;
    status: string;
    subscription_start_date: string | null;
    nextBilling: string | null;
    paymentMethod: {
      type: string;
      last4: string;
      expiry: string;
    } | null;
    billingHistory: {
      id: string;
      date: string;
      amount: number;
      status: string;
    }[];
  }>({
    plan: null,
    status: 'loading',
    subscription_start_date: null,
    nextBilling: null,
    paymentMethod: null,
    billingHistory: []
  });
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedPlanInfo, setSelectedPlanInfo] = useState<Plan | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<{
    nextBilling: string | null;
    paymentMethod: {
      type: string;
      last4: string;
      expiry: string;
    } | null;
  }>({
    nextBilling: null,
    paymentMethod: null
  });
  const [error, setError] = useState('');

  const calculateDuration = (startDate: string) => {
    if (!startDate) return 0;
    
    const start = new Date(startDate);
    // Check if date is valid
    if (isNaN(start.getTime())) return 0;
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
    return diffMonths;
  };

  // Pluralize months correctly
  const pluralizeMonths = (count: number) => {
    if (count === 0) return 'Less than 1 month';
    return `${count} month${count === 1 ? '' : 's'}`;
  };

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user) return;

      try {
        // Fetch user's plan
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            plan_id,
            subscription_status,
            subscription_start_date,
            next_billing_date,
            pricing_plans (
              id,
              name,
              price_monthly,
              price_annual,
              credit_rate,
              min_credits,
              included_credits,
              features
            )
          `)
          .eq('id', user.id)
          .single();

        if (userError) throw userError;

        // Fetch payment method
        const { data: paymentData, error: paymentError } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle();

        if (paymentError) throw paymentError;

        // Fetch billing history
        const { data: billingData, error: billingError } = await supabase
          .from('billing_history')
          .select('id, created_at, amount, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (billingError) throw billingError;

        // Transform the data
        const plan = userData.pricing_plans ? {
          name: userData.pricing_plans.name,
          price: userData.pricing_plans.price_monthly,
          annualPrice: userData.pricing_plans.price_annual,
          pricePerCredit: userData.pricing_plans.credit_rate,
          minimumCredits: userData.pricing_plans.min_credits,
          includedCredits: userData.pricing_plans.included_credits,
          features: userData.pricing_plans.features
        } : null;

        setCurrentSubscription({
          plan,
          status: userData.subscription_status,
          subscription_start_date: userData.subscription_start_date,
          nextBilling: userData.next_billing_date,
          paymentMethod: paymentData && paymentData.type ? {
            type: paymentData.type,
            last4: paymentData.last4,
            expiry: paymentData.expiry
          } : null,
          billingHistory: billingData.map(bill => ({
            id: bill.id,
            date: bill.created_at,
            amount: bill.amount,
            status: bill.status
          }))
        });

        // Update subscriptionData state
        setSubscriptionData({
          nextBilling: userData.next_billing_date,
          paymentMethod: paymentData && paymentData.type ? {
            type: paymentData.type,
            last4: paymentData.last4,
            expiry: paymentData.expiry
          } : null
        });
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      }
    };

    fetchSubscriptionData();
  }, [user]);

  const handleShowInfo = (plan: Plan) => {
    setSelectedPlanInfo(plan);
    setShowInfoModal(true);
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

  const formatDate = (date: Date | string) => {
    if (!date) return 'Not available';
    
    // Check if date is valid
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Not available';
    
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const plans: Plan[] = [
    {
      name: 'Free Plan',
      price: null,
      pricePerCredit: 0.03,
      minimumCredits: 500,
      features: [
        'Basic data extraction',
        'Export to CSV',
        'Email support',
        'Pay as you go',
        'No monthly fees'
      ]
    },
    {
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
        'Ghost mode scraping'
      ]
    },
    {
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
        'Volume discounts'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#0F0]">My Subscription</h2>
        <p className="text-gray-400">Manage your subscription plan and settings</p>
      </div>

      {/* Current Subscription */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-[#0F0] mb-6">Current Plan</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-[#0F0]/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-[#0F0]" />
                <div>
                  <div className="text-sm text-gray-400">Current Plan</div>
                  <div className="font-mono text-[#0F0]">{currentSubscription.plan?.name || 'Loading...'}</div>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0F0]/10 text-[#0F0]">
                {currentSubscription.status === 'loading' ? 'Loading...' : currentSubscription.status}
              </span>
            </div>

            {/* Credit Details */}
            <div className="mt-4 space-y-3 pt-4 border-t border-[#0F0]/20">
              <h4 className="text-sm font-semibold text-[#0F0] mb-3">Credit Details</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Credit Rate:</span>
                <span className="text-[#0F0] font-mono">
                  ${currentSubscription.plan?.pricePerCredit.toFixed(3) || '--'}/credit
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Minimum Purchase:</span>
                <span className="text-[#0F0] font-mono">
                  {currentSubscription.plan?.minimumCredits.toLocaleString() || '--'} credits
                </span>
              </div>
              {currentSubscription.plan?.includedCredits && currentSubscription.plan.includedCredits > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Monthly Credits:</span>
                  <span className="text-[#0F0] font-mono">
                    {currentSubscription.plan.includedCredits.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Subscription Info */}
            <div className="mt-6 pt-4 border-t border-[#0F0]/20">
              <h4 className="text-sm font-semibold text-[#0F0] mb-3">Subscription Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Started On:</span>
                  <span className="text-[#0F0] font-mono">
                    {formatDate(currentSubscription.subscription_start_date || new Date())}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Next Billing:</span>
                  <span className="text-[#0F0] font-mono">
                    {subscriptionData.nextBilling ? formatDate(subscriptionData.nextBilling) : 'No billing date set'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-[#0F0] font-mono">
                    {pluralizeMonths(calculateDuration(currentSubscription.subscription_start_date || ''))}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mt-6 pt-4 border-t border-[#0F0]/20">
              <h4 className="text-sm font-semibold text-[#0F0] mb-3">Payment Method</h4>
              <div className="flex items-center justify-between p-4 border border-[#0F0]/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-[#0F0]" />
                  <div className="flex-1">
                    {subscriptionData.paymentMethod ? (
                      <div className="font-mono text-[#0F0]">
                        Card ending in {subscriptionData.paymentMethod.last4} (expires {subscriptionData.paymentMethod.expiry})
                      </div>
                    ) : (
                      <div className="font-mono text-[#0F0]">No payment method</div>
                    )}
                  </div>
                </div>
                <Button variant="secondary" className="text-sm">
                  Update
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-[#0F0] mb-6">Billing History</h3>
          <div className="space-y-4">
            {currentSubscription.billingHistory.length > 0 ? currentSubscription.billingHistory.map((invoice) => (
              <div 
                key={invoice.id}
                className="flex items-center justify-between p-4 border border-[#0F0]/20 rounded-lg"
              >
                <div>
                  <div className="font-semibold">${invoice.amount.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">{formatDate(new Date(invoice.date))}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    invoice.status === 'paid'
                      ? 'bg-[#0F0]/10 text-[#0F0]'
                      : 'bg-yellow-400/10 text-yellow-400'
                  }`}>
                    {invoice.status}
                  </span>
                  <Button variant="secondary" className="text-sm">
                    Download
                  </Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-4 text-gray-400">
                No billing history available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-[#0F0] mb-6">Available Plans</h3>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center space-x-4 mb-8">
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

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8">
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
                variant={currentSubscription.plan?.name === plan.name ? 'secondary' : 'primary'}
              >
                {currentSubscription.plan?.name === plan.name 
                  ? 'Current Plan'
                  : 'Upgrade Plan'}
              </Button>
            </div>
          ))}
        </div>

        {/* Legal Notices */}
        <div className="mt-8">
          <LegalNotices 
            type="purchase"
            checked={agreedToTerms}
            onChange={setAgreedToTerms}
          />
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && selectedPlanInfo && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowInfoModal(false)}
          />
          
          <div className="relative bg-black/90 border border-[#0F0]/30 rounded-xl p-8 max-w-2xl w-full mx-4">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-[#0F0] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-[#0F0]">
                {selectedPlanInfo.name} - Minimum Purchase
              </h3>
              
              <p className="text-gray-300 text-lg leading-relaxed">
                {selectedPlanInfo.name === 'Free Plan'
                  ? 'Minimum purchase of 500 credits required per order.'
                  : selectedPlanInfo.name === 'Pro Plan'
                    ? 'After using your subscription credits, you must purchase a minimum of 2,500 credits per order to maintain $0.02 per credit. Orders below this amount will be charged at $0.03 per credit.'
                    : 'After using your subscription credits, you must purchase a minimum of 25,000 credits per order to maintain $0.01 per credit. Orders below this amount will be charged at $0.02 per credit.'
                }
              </p>
              
              <div className="space-y-4 mt-6">
                <h4 className="text-lg font-semibold text-[#0F0]">Key Details:</h4>
                <ul className="space-y-3">
                  {selectedPlanInfo.name === 'Free Plan' ? [
                    'Each credit allows you to extract one contact',
                    'Pay-as-you-go pricing at $0.03 per credit',
                    'No subscription fee required'
                  ] : selectedPlanInfo.name === 'Pro Plan' ? [
                    `Monthly subscription includes 2,500 credits (${billingCycle === 'annual' ? '30,000 annually' : '2,500 monthly'})`,
                    'Additional credits at $0.02 each (minimum 2,500)',
                    'Smaller orders possible at $0.03 per credit',
                    'Automatic monthly credit renewal'
                  ] : [
                    `Monthly subscription includes 10,000 credits (${billingCycle === 'annual' ? '120,000 annually' : '10,000 monthly'})`,
                    'Additional credits at $0.01 each (minimum 25,000)',
                    'Medium orders available at $0.02 per credit',
                    'Automatic monthly credit renewal',
                    'Volume discounts available'
                  ].map((detail, index) => (
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
    </div>
  );
};

export default MySubscription;