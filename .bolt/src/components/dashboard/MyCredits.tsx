import React, { useState, useEffect } from 'react';
import { CreditCard, Shield, Zap } from 'lucide-react';
import Button from '../Button';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';

const MyCredits = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { credits, setCredits } = useUser();
  const [creditAmount, setCreditAmount] = useState<number>(2500);
  const [currentPlan, setCurrentPlan] = useState('Loading...');

  const ABSOLUTE_MINIMUM_CREDITS = 500;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select(`
            credits,
            pricing_plans (
              name
            )
          `)
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (userData) {
          setCredits(userData.credits);
          setCurrentPlan(userData.pricing_plans?.name || 'Free Plan');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user, setCredits]);

  const minimumCredits = {
    'Free Plan': 500,
    'Pro Plan': 2500,
    'Enterprise Plan': 25000
  };

  const standardPricePerCredit = {
    'Free Plan': 0.03,
    'Pro Plan': 0.02,
    'Enterprise Plan': 0.01
  };

  const belowMinimumPricePerCredit = {
    'Free Plan': 0.03, // Free plan always has the same rate
    'Pro Plan': 0.03, // Pro plan falls back to Free plan rate
    'Enterprise Plan': 0.02 // Enterprise plan falls back to Pro plan rate
  };

  const getCurrentRate = () => {
    const planMinimum = minimumCredits[currentPlan as keyof typeof minimumCredits];
    if (creditAmount >= planMinimum) {
      return standardPricePerCredit[currentPlan as keyof typeof standardPricePerCredit];
    }
    return belowMinimumPricePerCredit[currentPlan as keyof typeof belowMinimumPricePerCredit];
  };

  const handleCreditAmountChange = (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    // Allow any number input
    setCreditAmount(Math.max(0, num));
  };

  const calculateTotal = () => {
    return (creditAmount * getCurrentRate()).toFixed(2);
  };

  const isBelowPlanMinimum = creditAmount < minimumCredits[currentPlan as keyof typeof minimumCredits];
  const isBelowAbsoluteMinimum = creditAmount < ABSOLUTE_MINIMUM_CREDITS;

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#0F0]">{t('dashboard.credits')}</h2>
        <p className="text-gray-400">Purchase additional credits based on your subscription plan</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Current Status */}
        <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-[#0F0] mb-6">Current Status</h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 border border-[#0F0]/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-[#0F0]" />
                <div>
                  <div className="font-semibold">Current Plan</div>
                  <div className="text-sm text-gray-400">Your active subscription</div>
                </div>
              </div>
              <span className="text-[#0F0] font-mono">
                {currentPlan === 'Loading...' ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  currentPlan
                )}
              </span>
            </div>

            <div className="flex justify-between items-center p-4 border border-[#0F0]/20 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-[#0F0]" />
                <div>
                  <div className="font-semibold">Available Credits</div>
                  <div className="text-sm text-gray-400">Your current balance</div>
                </div>
              </div>
              <span className="text-[#0F0] font-mono">
                {credits === 0 && currentPlan === 'Loading...' ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  credits.toLocaleString()
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Purchase Credits */}
        <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-[#0F0] mb-6">Purchase Credits</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Number of Credits</label>
              <div className="relative">
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => handleCreditAmountChange(e.target.value)}
                  step={100}
                  className={`w-full bg-black/50 border rounded-lg py-3 px-4 text-white font-mono focus:ring-1 transition-all ${
                    isBelowAbsoluteMinimum
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50'
                      : isBelowPlanMinimum 
                        ? 'border-yellow-400/50 focus:border-yellow-400 focus:ring-yellow-400/50' 
                        : 'border-[#0F0]/30 focus:border-[#0F0] focus:ring-[#0F0]'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  credits
                </div>
              </div>
            </div>

            <div className="p-4 border border-[#0F0]/20 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Current Rate</span>
                <span className={`font-mono ${
                  isBelowAbsoluteMinimum 
                    ? 'text-red-500' 
                    : isBelowPlanMinimum 
                      ? 'text-yellow-400' 
                      : 'text-[#0F0]'
                }`}>
                  ${getCurrentRate()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Number of Credits</span>
                <span className={`font-mono ${isBelowAbsoluteMinimum ? 'text-red-500' : 'text-[#0F0]'}`}>
                  {creditAmount}
                </span>
              </div>
              <div className="border-t border-[#0F0]/20 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total</span>
                  <span className={`font-mono text-xl ${
                    isBelowAbsoluteMinimum 
                      ? 'text-red-500' 
                      : 'text-[#0F0]'
                  }`}>
                    ${calculateTotal()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Shield className="w-4 h-4" />
              Credits never expire and can be used at any time
            </div>

            <div>
              <Button 
                className="w-full mt-4"
                disabled={isBelowAbsoluteMinimum}
              >
                Purchase Credits
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCredits;
