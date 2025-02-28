import React from 'react';
import { Zap, Download, CreditCard, Shield, PlayCircle, Users, Terminal, Loader, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../Button';
import GlitchText from '../GlitchText';
import { useUser, Plan } from '../../contexts/UserContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';

interface UserActivity {
  id: string;
  type: string;
  description: string;
  credits_change: number;
  credits_after: number;
  metadata: any;
  created_at: string;
}

interface UserPlan {
  name: string;
  included_credits: number;
  min_credits: number;
  credit_rate: number;
  subscription_start_date: string;
  previous_plans: {
    plan_id: string;
    start_date: string;
    end_date: string;
  }[];
}

const DashboardHome = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { credits } = useUser();
  const { setShowOnboarding } = useOnboarding();
  const { user } = useAuth();
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const discordUrl = 'https://discord.gg/your-discord-invite';

  const userName = user?.user_metadata?.first_name || 'User';

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!user) return;
      
      try {
        // First get the user's plan_id
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('plan_id, subscription_start_date, previous_plans')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;
        if (!userData?.plan_id) throw new Error('No plan ID found');

        // Then get the plan details
        const { data: planData, error } = await supabase
          .from('pricing_plans')
          .select('name, included_credits, min_credits, credit_rate')
          .eq('id', userData.plan_id)
          .single();

        if (error) throw error;

        setUserPlan({
          ...planData,
          subscription_start_date: userData.subscription_start_date,
          previous_plans: userData.previous_plans || []
        } as UserPlan);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user plan:', err);
        setUserPlan(null);
        setLoading(false);
      }
    };

    fetchUserPlan();

    // Set up real-time subscription
    const subscription = supabase
      .channel('users_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        () => {
          fetchUserPlan();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Fetch user activities
  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;
      
      try {
        setLoadingActivities(true);
        const { data, error } = await supabase
          .from('user_activities')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setActivities(data || []);
      } catch (err) {
        console.error('Error fetching activities:', err);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchActivities();

    // Set up real-time subscription
    const subscription = supabase
      .channel('activities_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_activities',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Calculate credit usage percentage
  const calculateCreditPercentage = () => {
    if (!userPlan) return 0;

    // If plan has included credits, show percentage of those remaining
    if (userPlan.included_credits > 0) {
      return Math.min((credits / userPlan.included_credits) * 100, 100);
    }

    // For pay-as-you-go plans, show percentage based on minimum purchase requirement
    return Math.min((credits / userPlan.min_credits) * 100, 100);
  };

  // Calculate subscription duration in months
  const calculateSubscriptionDuration = (startDate: string) => {
    if (!startDate) return 0;

    const start = new Date(startDate);
    // Check if date is valid
    if (isNaN(start.getTime())) return 0;
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
    return diffMonths;
  };

  const formatDate = (date: string) => {
    if (!date) return 'Not available';

    const start = new Date(date);
    // Check if date is valid
    if (isNaN(start.getTime())) return 'Not available';

    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Pluralize months correctly
  const pluralizeMonths = (count: number) => {
    if (count === 0) return 'Less than 1 month';
    return `${count} month${count === 1 ? '' : 's'}`;
  };

  const creditPercentage = calculateCreditPercentage();
  
  const getCreditBarColor = (percentage: number) => {
    // More granular color transitions based on percentage
    if (percentage < 20) {
      return 'bg-red-500';
    } else if (percentage < 40) {
      return 'bg-orange-500';
    } else if (percentage < 60) {
      return 'bg-yellow-500';
    } else if (percentage < 80) {
      return 'bg-green-400';
    } else {
      return 'bg-[#0F0]';
    }
  };

  const quickActions = [
    { 
      icon: Zap, 
      label: 'Start New Extraction', 
      color: 'text-yellow-400',
      onClick: () => navigate('/start-scraping')
    },
    { 
      icon: Download, 
      label: 'Download Data', 
      color: 'text-blue-400',
      onClick: () => navigate('/dashboard/export')
    },
    { 
      icon: CreditCard, 
      label: 'Buy Credits', 
      color: 'text-purple-400',
      onClick: () => navigate('/dashboard/credits')
    },
    { 
      icon: Shield, 
      label: 'Security Settings', 
      color: 'text-green-400',
      onClick: () => navigate('/dashboard/settings')
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div className="mb-8">
        <GlitchText 
          text={t('dashboard.welcome', { name: userName })}
          className="text-4xl font-bold mb-4"
        />
        <p className="text-gray-400">{t('dashboard.subtitle')}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="secondary"
            className="h-32 flex flex-col items-center justify-center gap-4 group"
            onClick={action.onClick}
          >
            <action.icon className={`w-8 h-8 ${action.color} group-hover:scale-110 transition-transform`} />
            <span className="text-sm">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Credits Usage */}
        <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6 hover:border-[#0F0]/50 transition-all">
          <h3 className="text-[#0F0] text-lg mb-4">Credits Usage</h3>
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-2 bg-[#0F0]/10 rounded"></div>
              <div className="h-4 bg-[#0F0]/10 rounded w-1/4"></div>
            </div>
          ) : (
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${getCreditBarColor(creditPercentage)} bg-opacity-20 px-2 py-0.5 rounded`}>
                    {creditPercentage.toFixed(0)}%
                  </span>
                  <div className="text-sm text-gray-400">
                    {loading ? (
                      'Loading...'
                    ) : userPlan?.included_credits ? (
                      `${credits.toLocaleString()} / ${userPlan.included_credits.toLocaleString()} credits`
                    ) : (
                      `${credits.toLocaleString()} credits available`
                    )}
                  </div>
                </div>
              </div>
              <div className="overflow-hidden h-3 text-xs flex rounded-full bg-[#0F0]/10">
                <div
                  style={{ width: `${creditPercentage}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 rounded-full ${getCreditBarColor(creditPercentage)}`}
                />
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-[#0F0]">
                  Current Plan: {loading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    <span className="font-semibold">{userPlan?.name || 'Free Plan'}</span>
                  )}
                </p>
                {/* Credit Details */}
                <div className="mt-4 space-y-3 pt-4 border-t border-[#0F0]/20">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Credit Rate:</span>
                    <span className="text-[#0F0] font-mono">
                      ${loading ? '--' : userPlan?.credit_rate.toFixed(3)}/credit
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Minimum Purchase:</span>
                    <span className="text-[#0F0] font-mono">
                      {loading ? '--' : userPlan?.min_credits.toLocaleString()} credits
                    </span>
                  </div>
                  {userPlan?.included_credits > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Monthly Credits:</span>
                      <span className="text-[#0F0] font-mono">
                        {userPlan.included_credits.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Available Credits:</span>
                    <span className="text-[#0F0] font-mono">
                      {loading ? '--' : credits.toLocaleString()}
                    </span>
                  </div>
                </div>
                {/* Subscription Info */}
                <div className="mt-6 pt-4 border-t border-[#0F0]/20">
                  <h4 className="text-sm font-semibold text-[#0F0] mb-3">Subscription Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Started On:</span>
                      <span className="text-[#0F0] font-mono">
                        {loading ? '--' : formatDate(userPlan?.subscription_start_date || '')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-[#0F0] font-mono">
                        {loading ? '--' : pluralizeMonths(calculateSubscriptionDuration(userPlan?.subscription_start_date || ''))}
                      </span>
                    </div>
                    {userPlan?.previous_plans?.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm text-gray-400 mb-2">Previous Plans:</div>
                        <div className="space-y-2">
                          {userPlan.previous_plans.map((plan, index) => (
                            <div key={index} className="text-xs text-gray-500">
                              {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6 hover:border-[#0F0]/50 transition-all col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[#0F0] text-lg">Recent Activity</h3>
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                className="text-sm px-3 py-1.5"
                onClick={() => setShowOnboarding(true)}
              >
                <PlayCircle className="w-4 h-4 mr-1" />
                Watch Tutorial
              </Button>
              <a 
                href={discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-[#0F0] transition-all duration-300 group"
              >
                <Button variant="secondary" className="text-sm px-3 py-1.5">
                  <Users className="w-4 h-4 mr-1 group-hover:text-[#0F0] group-hover:animate-pulse transition-all duration-300" />
                  Community
                </Button>
              </a>
            </div>
          </div>

          {loadingActivities ? (
            <div className="text-center py-12">
              <Loader className="w-12 h-12 text-[#0F0] mx-auto mb-4 animate-spin" />
              <p className="text-gray-400">Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <Terminal className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No recent activity. Start your first extraction!</p>
              <Button 
                className="mt-4"
                onClick={() => navigate('/start-scraping')}
              >
                Start Extraction
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 border border-[#0F0]/20 rounded-lg hover:border-[#0F0]/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Activity Icon */}
                    {activity.type === 'subscription' && (
                      <CreditCard className="w-5 h-5 text-purple-400" />
                    )}
                    {activity.type === 'extraction' && (
                      <Terminal className="w-5 h-5 text-blue-400" />
                    )}
                    {activity.type === 'purchase' && (
                      <Wallet className="w-5 h-5 text-green-400" />
                    )}
                    
                    {/* Activity Details */}
                    <div>
                      <div className="font-medium">{activity.description}</div>
                      <div className="text-sm text-gray-400">
                        {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Credits Change */}
                  <div className="text-right">
                    <div className={`font-mono ${
                      activity.credits_change > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {activity.credits_change > 0 ? '+' : ''}{activity.credits_change.toLocaleString()} credits
                    </div>
                    <div className="text-sm text-gray-400">
                      Balance: {activity.credits_after.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;