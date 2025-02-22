import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, AlertCircle, Play, Clock, Hash, Users, Terminal, Loader } from 'lucide-react';
import Button from '../Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import LegalNotices from '../LegalNotices';
import { supabase } from '../../lib/supabase';

interface Order {
  id: string;
  source_type: string;
  status: string;
  status_display: string;
  source: string;
  max_leads: number;
  scraped_leads: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  csv_url: string | null;
  error: string | null;
}

const OrdersHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Status check interval
  useEffect(() => {
    const checkOrderStatus = async () => {
      const pendingOrders = orders.filter(order => 
        order.status !== 'completed' && order.status !== 'failed'
      );

      if (pendingOrders.length > 0) {
        const { data: updatedOrders, error } = await supabase
          .from('orders')
          .select('*')
          .in('id', pendingOrders.map(order => order.id));

        if (!error && updatedOrders) {
          setOrders(prev => {
            const newOrders = [...prev];
            updatedOrders.forEach(updatedOrder => {
              const index = newOrders.findIndex(o => o.id === updatedOrder.id);
              if (index !== -1) {
                newOrders[index] = updatedOrder;
              }
            });
            return newOrders;
          });
        }
      }
    };

    // Check status every minute
    const interval = setInterval(checkOrderStatus, 60000);
    return () => clearInterval(interval);
  }, [orders]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching extractions:', err);
      setError('Failed to load extractions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueScraping = (order: Order) => {
    navigate('/start-scraping', {
      state: { 
        continueExtraction: true,
        orderId: order.id,
        source: order.source,
        sourceType: order.source_type
      }
    });
  };

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      order.source.toLowerCase().includes(query) ||
      order.source_type.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[#0F0]">Orders & History</h2>
        <Button>
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by target or type..."
            className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#0F0]/20">
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Source Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Order ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Source</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Max Leads</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Scraped</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Updated</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F0]/10">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#0F0]/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        {order.source_type === 'HT' ? (
                          <Hash className="w-4 h-4" />
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                        {order.source_type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'completed'
                          ? 'bg-[#0F0]/10 text-[#0F0]'
                          : order.status === 'failed'
                            ? 'bg-red-400/10 text-red-400'
                            : 'bg-yellow-400/10 text-yellow-400'
                      }`}>
                        {order.status_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[#0F0]">{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{order.source}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{order.max_leads}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{order.scraped_leads}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{formatDate(order.created_at)}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{formatDate(order.updated_at)}</td>
                    <td className="px-6 py-4">
                      {order.status === 'completed' && order.csv_url && (
                        <Button
                          variant="secondary"
                          className="w-full text-xs bg-[#0F0]/5 hover:bg-[#0F0]/10 border-[#0F0]/30 hover:border-[#0F0]/50 text-[#0F0] transition-all duration-300 flex items-center justify-center gap-1.5"
                          onClick={() => window.open(order.csv_url, '_blank')}
                        >
                          <Download className="w-3 h-3" />
                          Download CSV
                        </Button>
                      )}
                      {order.status === 'failed' && (
                        <>
                          <div className="w-full px-3 py-1.5 text-xs text-red-400 bg-red-400/5 border border-red-400/30 rounded-lg flex items-center justify-center gap-1.5">
                            <AlertCircle className="w-3 h-3" />
                            {order.error || 'Extraction failed'}
                          </div>
                          <Button
                            variant="secondary"
                            className="w-full text-xs bg-black/50 hover:bg-black/70 border-[#0F0]/30 hover:border-[#0F0]/50 text-[#0F0] transition-all duration-300 flex items-center justify-center gap-1.5"
                            onClick={() => handleContinueScraping(order)}
                          >
                            <Play className="w-3 h-3" />
                            Continue Scraping
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Terminal className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No extractions found. Start your first extraction!</p>
                    <Button 
                      className="mt-4"
                      onClick={() => navigate('/start-scraping')}
                    >
                      Start Extraction
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrdersHistory;
