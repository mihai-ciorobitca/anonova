import React, { useState } from 'react';
import { Users, Wallet, Terminal, Copy, Check, Calculator, ExternalLink, MessageSquare, ArrowUpRight, ArrowDownRight, Clock, Filter, Search, User, CreditCard, History, X } from 'lucide-react';
import Button from '../Button';
import { useTranslation } from 'react-i18next';

interface ReferralEarning {
  id: string;
  referree: string;
  date: string;
  credits: number;
  plan: string;
  earnings: number;
  status: 'pending' | 'available' | 'paid';
}

interface PayoutHistory {
  id: string;
  date: string;
  amount: number;
  ethPrice: number;
  ethAmount: number;
  status: 'processing' | 'completed' | 'failed';
  txHash?: string;
}

interface PurchaseHistory {
  id: string;
  date: string;
  credits: number;
  amount: number;
  plan: string;
  rate: number;
  referralRate: number;
}

interface ReferredUser {
  id: string;
  username: string;
  joinDate: string;
  totalSpent: number;
  status: 'active' | 'inactive';
  currentPlan: string;
  avatar: string;
  lastActive: string;
  purchaseHistory: PurchaseHistory[];
  planHistory: {
    date: string;
    plan: string;
  }[];
}

const ReferralsPage = () => {
  const { t } = useTranslation();
  const [showCopied, setShowCopied] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<ReferredUser | null>(null);
  const referralCode = 'matr1x123';
  const referralLink = `anonova.ai/r/${referralCode}`;
  const discordUrl = 'https://discord.gg/your-discord-invite';

  // Mock data - in a real app, this would come from your backend
  const referralStats = {
    totalReferrals: 23,
    totalEarnings: 0.85,
    pendingEarnings: 0.12,
    ethPrice: 3500,
    canRequestPayout: true
  };

  // Mock referred users data with purchase history
  const referredUsers: ReferredUser[] = [
    {
      id: 'USR001',
      username: 'cryptohunter',
      joinDate: '2024-03-15',
      totalSpent: 150.00,
      status: 'active',
      currentPlan: 'Pro Plan',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop&crop=faces',
      lastActive: '2 hours ago',
      purchaseHistory: [
        {
          id: 'PUR001',
          date: '2024-03-15',
          credits: 2500,
          amount: 75.00,
          plan: 'Free Plan',
          rate: 0.03,
          referralRate: 0.20
        },
        {
          id: 'PUR002',
          date: '2024-03-16',
          credits: 2500,
          amount: 50.00,
          plan: 'Pro Plan',
          rate: 0.02,
          referralRate: 0.20
        }
      ],
      planHistory: [
        {
          date: '2024-03-15',
          plan: 'Free Plan'
        },
        {
          date: '2024-03-16',
          plan: 'Pro Plan'
        }
      ]
    },
    {
      id: 'USR002',
      username: 'datamaster',
      joinDate: '2024-03-14',
      totalSpent: 299.00,
      status: 'active',
      currentPlan: 'Enterprise Plan',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=50&h=50&fit=crop&crop=faces',
      lastActive: '5 minutes ago',
      purchaseHistory: [
        {
          id: 'PUR003',
          date: '2024-03-14',
          credits: 25000,
          amount: 250.00,
          plan: 'Enterprise Plan',
          rate: 0.01,
          referralRate: 0.20
        }
      ],
      planHistory: [
        {
          date: '2024-03-14',
          plan: 'Enterprise Plan'
        }
      ]
    }
  ];

  // Mock payout history
  const payoutHistory: PayoutHistory[] = [
    {
      id: 'PAY001',
      date: '2024-03-10',
      amount: 250.00,
      ethPrice: 3450,
      ethAmount: 0.0725,
      status: 'completed',
      txHash: '0x1234...5678'
    },
    {
      id: 'PAY002',
      date: '2024-02-15',
      amount: 350.00,
      ethPrice: 3200,
      ethAmount: 0.1094,
      status: 'completed',
      txHash: '0xabcd...efgh'
    }
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRequestPayout = () => {
    window.open(discordUrl + '/payout-request', '_blank');
  };

  const filterReferredUsers = (users: ReferredUser[]) => {
    if (!searchQuery) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.currentPlan.toLowerCase().includes(query)
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#0F0]">{t('dashboard.referrals')}</h2>
        <p className="text-gray-400">{t('dashboard.referralsSubtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-[#0F0]" />
            <h3 className="text-lg font-bold">Total Referrals</h3>
          </div>
          <div className="text-3xl font-bold">{referralStats.totalReferrals}</div>
          <p className="text-sm text-gray-400 mt-2">Active referral users</p>
        </div>

        <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-8 h-8 text-[#0F0]" />
            <h3 className="text-lg font-bold">Total Earnings</h3>
          </div>
          <div className="text-3xl font-bold flex items-baseline gap-2">
            <span>{referralStats.totalEarnings} ETH</span>
            <span className="text-lg text-gray-400">
              (${(referralStats.totalEarnings * referralStats.ethPrice).toFixed(2)})
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-2">Lifetime earnings</p>
        </div>

        <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Terminal className="w-8 h-8 text-[#0F0]" />
            <h3 className="text-lg font-bold">Pending Earnings</h3>
          </div>
          <div className="text-3xl font-bold flex items-baseline gap-2">
            <span>{referralStats.pendingEarnings} ETH</span>
            <span className="text-lg text-gray-400">
              (${(referralStats.pendingEarnings * referralStats.ethPrice).toFixed(2)})
            </span>
          </div>
          {(referralStats.pendingEarnings * referralStats.ethPrice) >= 200 ? (
            <Button 
              className="w-full mt-4"
              onClick={handleRequestPayout}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Request Payout
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <p className="text-sm text-gray-400 mt-2">
              ${(200 - (referralStats.pendingEarnings * referralStats.ethPrice)).toFixed(2)} more until payout available
            </p>
          )}
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-[#0F0] mb-6">Your Referral Link</h3>
        <div className="flex gap-4">
          <div className="flex-1 bg-black/50 border border-[#0F0]/30 rounded-lg py-4 px-4 text-white font-mono">
            {referralLink}
          </div>
          <Button
            className="flex items-center gap-2 min-w-[120px] justify-center"
            onClick={handleCopyLink}
          >
            {showCopied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </div>
        <div className="mt-4 text-sm text-gray-400">
          Share this link and earn 20% of the credit value used by your referrals, paid in ETH
        </div>
      </div>

      {/* Referred Users */}
      <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-[#0F0] mb-6">Referred Users</h3>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username..."
              className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
            />
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {filterReferredUsers(referredUsers).map((user) => (
            <div
              key={user.id}
              className="bg-black/60 border border-[#0F0]/20 rounded-lg p-4 hover:border-[#0F0]/50 transition-all cursor-pointer"
              onClick={() => setSelectedUser(user)}
            >
              <div className="flex items-center gap-4">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-12 h-12 rounded-full object-cover border border-[#0F0]/30"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{user.username}</div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' 
                        ? 'bg-[#0F0]/10 text-[#0F0]' 
                        : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Joined {formatDate(user.joinDate)}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="text-gray-400">Current Plan</div>
                  <div className="font-mono text-[#0F0]">{user.currentPlan}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-gray-400">Total Spent</div>
                  <div className="font-mono text-[#0F0]">${user.totalSpent.toFixed(2)}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Last active: {user.lastActive}
                </span>
                <span className="text-[#0F0]">
                  Click to view details
                </span>
              </div>
            </div>
          ))}
        </div>

        {filterReferredUsers(referredUsers).length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No referred users found</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedUser(null)}
          />
          
          <div className="relative bg-black/90 border border-[#0F0]/30 rounded-xl p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-[#0F0] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* User Header */}
            <div className="flex items-center gap-6 mb-8">
              <img
                src={selectedUser.avatar}
                alt={selectedUser.username}
                className="w-20 h-20 rounded-full object-cover border-2 border-[#0F0]/30"
              />
              <div>
                <h3 className="text-2xl font-bold text-[#0F0] mb-1">{selectedUser.username}</h3>
                <div className="text-gray-400">Member since {formatDate(selectedUser.joinDate)}</div>
              </div>
            </div>

            {/* Plan History */}
            <div className="mb-8">
              <h4 className="text-lg font-bold text-[#0F0] mb-4 flex items-center gap-2">
                <History className="w-5 h-5" />
                Plan History
              </h4>
              <div className="space-y-3">
                {selectedUser.planHistory.map((plan, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-[#0F0]/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-[#0F0] rounded-full" />
                      <span>{plan.plan}</span>
                    </div>
                    <span className="text-gray-400">{formatDate(plan.date)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase History */}
            <div>
              <h4 className="text-lg font-bold text-[#0F0] mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Purchase History
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#0F0]/20">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#0F0]">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#0F0]">Credits</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#0F0]">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#0F0]">Plan</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#0F0]">Rate</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#0F0]">Your Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0F0]/10">
                    {selectedUser.purchaseHistory.map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-[#0F0]/5 transition-colors">
                        <td className="px-4 py-3">{formatDate(purchase.date)}</td>
                        <td className="px-4 py-3">{purchase.credits.toLocaleString()}</td>
                        <td className="px-4 py-3">${purchase.amount.toFixed(2)}</td>
                        <td className="px-4 py-3">{purchase.plan}</td>
                        <td className="px-4 py-3">${purchase.rate.toFixed(3)}/credit</td>
                        <td className="px-4 py-3 text-[#0F0]">
                          ${(purchase.amount * purchase.referralRate).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-[#0F0]/20">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 font-bold">Total Earnings</td>
                      <td className="px-4 py-3 font-bold text-[#0F0]">
                        ${selectedUser.purchaseHistory.reduce((sum, purchase) => 
                          sum + (purchase.amount * purchase.referralRate), 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout History */}
      <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-[#0F0] mb-6">Payout History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#0F0]/20">
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Amount (USD)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">ETH Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">ETH Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Transaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F0]/10">
              {payoutHistory.map((payout) => (
                <tr key={payout.id} className="hover:bg-[#0F0]/5 transition-colors">
                  <td className="px-6 py-4 text-sm">{formatDate(payout.date)}</td>
                  <td className="px-6 py-4">${payout.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">${payout.ethPrice.toFixed(2)}</td>
                  <td className="px-6 py-4">{payout.ethAmount} ETH</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payout.status === 'completed'
                        ? 'bg-[#0F0]/10 text-[#0F0]'
                        : payout.status === 'processing'
                          ? 'bg-yellow-400/10 text-yellow-400'
                          : 'bg-red-400/10 text-red-400'
                    }`}>
                      {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {payout.txHash && (
                      <a
                        href={`https://etherscan.io/tx/${payout.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0F0] hover:underline flex items-center gap-1"
                      >
                        {payout.txHash.slice(0, 6)}...{payout.txHash.slice(-4)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Information */}
      <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-[#0F0] mb-6">Payout Information</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-[#0F0] rounded-full mt-2" />
            <div>
              <div className="font-semibold mb-1">Request Payouts via Discord</div>
              <p className="text-gray-400">Once you reach the $200 minimum balance, click "Request Payout" to open a ticket in Discord</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-[#0F0] rounded-full mt-2" />
            <div>
              <div className="font-semibold mb-1">Minimum Balance Required</div>
              <p className="text-gray-400">Earnings can only be redeemed after reaching a minimum balance of $200</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-[#0F0] rounded-full mt-2" />
            <div>
              <div className="font-semibold mb-1">Payment Method</div>
              <p className="text-gray-400">Payments are made to your registered ETH wallet address</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-[#0F0] rounded-full mt-2" />
            <div>
              <div className="font-semibold mb-1">Processing Time</div>
              <p className="text-gray-400">Payouts are processed within 24-48 hours after request approval</p>
            </div>
          </div>
        </div>

        {/* Discord Link */}
        <div className="mt-6 p-4 border border-[#0F0]/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-[#0F0]" />
              <div>
                <div className="font-semibold">Need help with payouts?</div>
                <div className="text-sm text-gray-400">Join our Discord community</div>
              </div>
            </div>
            <a 
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0F0] hover:underline flex items-center gap-1"
            >
              Join Discord
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralsPage;
