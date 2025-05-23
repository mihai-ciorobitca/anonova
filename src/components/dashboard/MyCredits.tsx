import React, { useState, useEffect } from "react";
import { CreditCard, Shield, Zap } from "lucide-react";
import Button from "../Button";
import { useTranslation } from "react-i18next";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useUser } from "../../contexts/UserContext";
import './MatrixLoader.css';

const MatrixLoader = () => (
  <div className="matrix-loader">
    <div className="flex items-center">
      <div className="spinner mr-2"></div>
      <div className="wave-text">
        {'Loading...'.split('').map((letter, index) => (
          <span
            key={index}
            className="wave-letter"
            style={{
              animationDelay: `${index * 0.15}s`,
              display: 'inline-block'
            }}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  </div>
);

const MyCredits = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { credits, setCredits } = useUser();
  const [creditAmount, setCreditAmount] = useState<number>(2500);
  const [currentPlan, setCurrentPlan] = useState("Loading...");
  const [averageCreditsPerMonth, setAverageCreditsPerMonth] = useState<number>(0);
  const [creditsUsedThisMonth, setCreditsUsedThisMonth] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  const ABSOLUTE_MINIMUM_CREDITS = 500;

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      if (!user) return;

      try {
        const { data: userData, error } = await supabase
          .from("users")
          .select(
            `
            credits,
            pricing_plans (
              id,
              name
            )
          `
          )
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (userData) {
          setCredits(userData.credits);
          setCurrentPlan(userData.pricing_plans.name || "Free Plan");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, setCredits]);

  useEffect(() => {
    const fetchCreditUsage = async () => {
      if (!user) return;

      setIsLoading(true); // Set loading state to true when fetching starts

      try {
        const { data: usageData, error } = await supabase
          .from('user_activities')
          .select(`created_at, credits_change`)
          .eq('user_id', user.id);

        if (error) throw error;

        console.log('Fetched usage data:', usageData); // Log fetched data

        if (usageData && usageData.length > 0) {
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const creditsThisMonth = usageData
            .filter(record => {
              const recordDate = new Date(record.created_at);
              return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
            })
            .reduce((sum, record) => sum + Math.abs(record.credits_change), 0);
          setCreditsUsedThisMonth(creditsThisMonth);

          const totalCreditsUsed = usageData.reduce((sum, record) => sum + Math.abs(record.credits_change), 0);
          const firstDate = new Date(usageData[0].created_at);
          const lastDate = new Date(usageData[usageData.length - 1].created_at);
          const totalMonths = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + (lastDate.getMonth() - firstDate.getMonth() + 1);
          console.log('Total credits used:', totalCreditsUsed, 'Total months:', totalMonths); // Log calculations
          const average = totalMonths > 0 ? totalCreditsUsed / totalMonths : 0;
          setAverageCreditsPerMonth(average); // Avoid division by zero
        } else {
          console.log('No usage data available.');
          setCreditsUsedThisMonth(0);
          setAverageCreditsPerMonth(0); // Set to 0 if no data
        }
      } catch (error) {
        console.error('Error fetching credit usage data:', error);
      } finally {
        setIsLoading(false); // Set loading state to false when fetching ends
      }
    };

    fetchCreditUsage();
  }, [user]);

  const minimumCredits = {
    "Free Plan": 500,
    "Pro Plan": 2500,
    "Enterprise Plan": 25000,
  };

  const standardPricePerCredit = {
    "Free Plan": 0.03,
    "Pro Plan": 0.02,
    "Enterprise Plan": 0.01,
  };

  const belowMinimumPricePerCredit = {
    "Free Plan": 0.03, // Free plan always has the same rate
    "Pro Plan": 0.03, // Pro plan falls back to Free plan rate
    "Enterprise Plan": 0.02, // Enterprise plan falls back to Pro plan rate
  };

  const getCurrentRate = () => {
    const planMinimum =
      minimumCredits[currentPlan as keyof typeof minimumCredits];
    if (creditAmount >= planMinimum) {
      return standardPricePerCredit[
        currentPlan as keyof typeof standardPricePerCredit
      ];
    }
    return belowMinimumPricePerCredit[
      currentPlan as keyof typeof belowMinimumPricePerCredit
    ];
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

  const isBelowPlanMinimum =
    creditAmount < minimumCredits[currentPlan as keyof typeof minimumCredits];
  const isBelowAbsoluteMinimum = creditAmount < ABSOLUTE_MINIMUM_CREDITS;

  return (
    <div className="space-y-8">
      {loading ? (
        <MatrixLoader />
      ) : (
        <div className="space-y-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0F0]">
              {t("dashboard.credits")}
            </h2>
            <p className="text-gray-400">
              Purchase additional credits based on your subscription plan
            </p>
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
                      <div className="text-sm text-gray-400">
                        Your active subscription
                      </div>
                    </div>
                  </div>
                  <span className="text-[#0F0] font-mono">
                    {currentPlan === "Loading..." ? (
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
                      <div className="text-sm text-gray-400">
                        Your current balance
                      </div>
                    </div>
                  </div>
                  <span className="text-[#0F0] font-mono">
                    {credits === 0 && currentPlan === "Loading..." ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      credits.toLocaleString()
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 border border-[#0F0]/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-[#0F0]" />
                    <div>
                      <div className="font-semibold">Credits Used This Month</div>
                      <div className="text-sm text-gray-400">
                        Your credits used this month
                      </div>
                    </div>
                  </div>
                  <span className="text-[#0F0] font-mono">
                    {creditsUsedThisMonth}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 border border-[#0F0]/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-[#0F0]" />
                    <div>
                      <div className="font-semibold">Average Credits Used Per Month</div>
                      <div className="text-sm text-gray-400">
                        Your average monthly usage
                      </div>
                    </div>
                  </div>
                  <span className="text-[#0F0] font-mono">
                    {averageCreditsPerMonth ? averageCreditsPerMonth.toFixed(2) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Purchase Credits */}
            <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-[#0F0] mb-6">
                Purchase Credits
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Number of Credits
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={creditAmount}
                      onChange={(e) => handleCreditAmountChange(e.target.value)}
                      step={100}
                      className={`w-full bg-black/50 border rounded-lg py-3 px-4 text-white font-mono focus:ring-1 transition-all ${
                        isBelowAbsoluteMinimum
                          ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/50"
                          : isBelowPlanMinimum
                          ? "border-yellow-400/50 focus:border-yellow-400 focus:ring-yellow-400/50"
                          : "border-[#0F0]/30 focus:border-[#0F0] focus:ring-[#0F0]"
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
                    <span
                      className={`font-mono ${
                        isBelowAbsoluteMinimum
                          ? "text-red-500"
                          : isBelowPlanMinimum
                          ? "text-yellow-400"
                          : "text-[#0F0]"
                      }`}
                    >
                      ${getCurrentRate()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Number of Credits</span>
                    <span
                      className={`font-mono ${
                        isBelowAbsoluteMinimum ? "text-red-500" : "text-[#0F0]"
                      }`}
                    >
                      {creditAmount}
                    </span>
                  </div>
                  <div className="border-t border-[#0F0]/20 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span
                        className={`font-mono text-xl ${
                          isBelowAbsoluteMinimum ? "text-red-500" : "text-[#0F0]"
                        }`}
                      >
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
                  <Button className="w-full mt-4" disabled={isBelowAbsoluteMinimum}>
                    Purchase Credits
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCredits;
