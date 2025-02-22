import React, { useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, Shield } from 'lucide-react';
import Button from '../Button';
import GlitchText from '../GlitchText';

const transactions = [
  {
    id: 'TX001',
    type: 'deposit',
    amount: '0.5',
    currency: 'ETH',
    status: 'completed',
    date: '2024-03-15 14:30',
    usdValue: '1,245.50',
  },
  {
    id: 'TX002',
    type: 'payment',
    amount: '0.2',
    currency: 'ETH',
    status: 'pending',
    date: '2024-03-15 12:15',
    usdValue: '498.20',
  },
  {
    id: 'TX003',
    type: 'deposit',
    amount: '1000',
    currency: 'USDT',
    status: 'completed',
    date: '2024-03-14 09:45',
    usdValue: '1,000.00',
  },
];

const WalletPage = () => {
  const [isWalletConnected] = useState(true);
  const [selectedCrypto, setSelectedCrypto] = useState('eth');
  const [gasPrice, setGasPrice] = useState('45');
  const [gasLimit, setGasLimit] = useState('21000');
  const [transactionSpeed, setTransactionSpeed] = useState('fast');

  const cryptoBalances = {
    eth: {
      balance: '2.5',
      usdValue: '6,245.75',
      address: '0x1234...5678',
    },
    btc: {
      balance: '0.12',
      usdValue: '4,892.40',
      address: 'bc1q...wxyz',
    },
    usdt: {
      balance: '1,500.00',
      usdValue: '1,500.00',
      address: '0xabcd...efgh',
    },
  };

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <GlitchText 
          text="Crypto Wallet"
          className="text-4xl font-bold mb-4"
        />
        <p className="text-gray-400">Manage your crypto assets and transactions</p>
      </div>

      {isWalletConnected ? (
        <>
          {/* Wallet Overview */}
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(cryptoBalances).map(([crypto, data]) => (
              <button
                key={crypto}
                onClick={() => setSelectedCrypto(crypto)}
                className={`bg-black/40 backdrop-blur-sm border rounded-xl p-6 transition-all ${
                  selectedCrypto === crypto
                    ? 'border-[#0F0] scale-105'
                    : 'border-[#0F0]/20 hover:border-[#0F0]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-[#0F0]">{crypto.toUpperCase()}</span>
                  <Wallet className="w-5 h-5 text-[#0F0]" />
                </div>
                <div className="text-2xl font-bold mb-2">{data.balance}</div>
                <div className="text-sm text-gray-400">≈ ${data.usdValue}</div>
              </button>
            ))}
          </div>

          {/* Selected Crypto Details */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Actions */}
            <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-[#0F0] mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button className="py-6">
                  <ArrowUpRight className="w-5 h-5 mr-2" />
                  Send
                </Button>
                <Button variant="secondary" className="py-6">
                  <ArrowDownRight className="w-5 h-5 mr-2" />
                  Receive
                </Button>
              </div>

              <div className="mt-6">
                <div className="text-sm text-gray-400 mb-2">Wallet Address</div>
                <div className="bg-black/60 rounded-lg p-4 font-mono text-sm break-all">
                  {cryptoBalances[selectedCrypto as keyof typeof cryptoBalances].address}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
                <Shield className="w-4 h-4" />
                Your wallet is secured with end-to-end encryption
              </div>
            </div>

            {/* Gas Calculator */}
            <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-[#0F0] mb-6">Gas Calculator</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Transaction Speed</label>
                  <select 
                    value={transactionSpeed}
                    onChange={(e) => setTransactionSpeed(e.target.value)}
                    className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                  >
                    <option value="fast">Fast (30 seconds)</option>
                    <option value="standard">Standard (2 minutes)</option>
                    <option value="slow">Slow (5 minutes)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Gas Price (Gwei)</label>
                    <input
                      type="number"
                      value={gasPrice}
                      onChange={(e) => setGasPrice(e.target.value)}
                      className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Gas Limit</label>
                    <input
                      type="number"
                      value={gasLimit}
                      onChange={(e) => setGasLimit(e.target.value)}
                      className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                    />
                  </div>
                </div>
                <div className="bg-black/60 rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Estimated Fee:</span>
                    <span className="text-[#0F0]">
                      {(Number(gasPrice) * Number(gasLimit) / 1e9).toFixed(6)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">USD Value:</span>
                    <span className="text-[#0F0]">
                      ${((Number(gasPrice) * Number(gasLimit) / 1e9) * 2500).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-[#0F0] mb-6">Transaction History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#0F0]/20">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Transaction ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">USD Value</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0F0]/10">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#0F0]/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-[#0F0]">{tx.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {tx.type === 'deposit' ? (
                            <ArrowDownRight className="w-4 h-4 text-green-400" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-blue-400" />
                          )}
                          <span className="capitalize">{tx.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {tx.amount} {tx.currency}
                      </td>
                      <td className="px-6 py-4">${tx.usdValue}</td>
                      <td className="px-6 py-4">
                        {tx.status === 'completed' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0F0]/10 text-[#0F0]">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-400">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 text-[#0F0] mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-[#0F0] mb-4">Connect Your Wallet</h3>
          <p className="text-gray-400 mb-8">Connect your crypto wallet to start managing your assets</p>
          <Button>
            Connect Wallet
          </Button>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
