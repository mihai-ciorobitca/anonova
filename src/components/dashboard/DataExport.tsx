import React, { useState } from 'react';
import { Download, Database, Calendar, Search, Terminal, Loader, AlertCircle } from 'lucide-react';
import Button from '../Button';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ExtractedList {
  id: string;
  date: string;
  type: 'followers' | 'following' | 'hashtag';
  target: string;
  count: number | null;
  status: string;
  error?: string | null;
}

const DataExport = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extractedLists, setExtractedLists] = useState<ExtractedList[]>([]);

  React.useEffect(() => {
    fetchExtractions();
  }, [user]);

  const fetchExtractions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('extractions')
        .select(`
          id,
          type,
          target,
          status,
          created_at,
          total_records,
          extracted_records,
          error
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedData: ExtractedList[] = data.map(item => ({
        id: item.id,
        date: item.created_at,
        type: item.type as 'followers' | 'following' | 'hashtag',
        target: item.target,
        count: item.total_records,
        status: item.status,
        error: item.error
      }));

      setExtractedLists(formattedData);
    } catch (err) {
      console.error('Error fetching extractions:', err);
      setError('Failed to load extractions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (extractionId: string) => {
    if (!user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('extraction_data')
        .select('data')
        .eq('extraction_id', extractionId);

      if (fetchError) throw fetchError;

      // Convert data to CSV
      const csvData = data.map(item => item.data);
      const csvString = convertToCSV(csvData);

      // Create and download file
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `extraction_${extractionId}_${new Date().toISOString()}.csv`;
      link.click();
    } catch (err) {
      console.error('Error downloading data:', err);
      setError('Failed to download data. Please try again.');
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';

    // Get headers from first object
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        return typeof val === 'string' ? `"${val}"` : val;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  };

  // Filter lists based on date range and search query
  const filteredLists = extractedLists.filter(list => {
    let matches = true;

    // Date range filter
    if (dateRange.start && dateRange.end) {
      const listDate = new Date(list.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matches = matches && (listDate >= startDate && listDate <= endDate);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matches = matches && (
        list.target.toLowerCase().includes(query) ||
        list.type.toLowerCase().includes(query)
      );
    }

    return matches;
  });

  const toggleList = (id: string) => {
    setSelectedLists(prev =>
      prev.includes(id)
        ? prev.filter(listId => listId !== id)
        : [...prev, id]
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
        <h2 className="text-3xl font-bold text-[#0F0]">{t('dashboard.export')}</h2>
        <p className="text-gray-400">Export your Instagram data in CSV format</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Date Range Selection */}
        <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-[#0F0]" />
            <h3 className="text-lg font-bold text-[#0F0]">Date Range</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-2 px-3 text-white focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-2 px-3 text-white focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Export Stats */}
        <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#0F0] mb-4">Export Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Selected Lists:</span>
              <span className="text-[#0F0] font-mono">{selectedLists.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Records:</span>
              <span className="text-[#0F0] font-mono">
                {formatNumber(
                  selectedLists.reduce((acc, id) => {
                    const list = extractedLists.find(l => l.id === id);
                    return acc + (list?.count || 0);
                  }, 0)
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Export Format:</span>
              <span className="text-[#0F0] font-mono">CSV</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Lists */}
      <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-[#0F0] mb-6">Available Lists</h3>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by target or type..."
              className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
            />
          </div>
        </div>
        
        {filteredLists.length > 0 ? (
          <div className="space-y-4">
            {filteredLists.map((list) => (
              <div
                key={list.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  selectedLists.includes(list.id)
                    ? 'border-[#0F0] bg-[#0F0]/10'
                    : 'border-gray-700 hover:border-[#0F0]/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedLists.includes(list.id)}
                    onChange={() => toggleList(list.id)}
                    className="w-5 h-5 rounded border-gray-700 text-[#0F0] focus:ring-[#0F0] bg-black"
                  />
                  <div>
                    <div className="font-semibold">{list.target}</div>
                    <div className="text-sm text-gray-400">
                      {formatDate(list.date)} • {list.type} • {formatNumber(list.count || 0)} records
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No lists found for the selected criteria</p>
          </div>
        )}

        <Button 
          className="w-full mt-6"
          disabled={selectedLists.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Selected Lists as CSV
        </Button>
      </div>

      <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {loading ? (
              <tbody>
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader className="w-12 h-12 text-[#0F0] mx-auto mb-4 animate-spin" />
                    <p className="text-gray-400">Loading extractions...</p>
                  </td>
                </tr>
              </tbody>
            ) : error ? (
              <tbody>
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-red-500 mb-4">{error}</div>
                    <Button onClick={fetchExtractions}>
                      Retry
                    </Button>
                  </td>
                </tr>
              </tbody>
            ) : filteredLists.length === 0 ? (
              <tbody>
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
              </tbody>
            ) : (
              <>
                <thead>
                  <tr className="border-b border-[#0F0]/20">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Order ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0F0]/10">
                  {filteredLists.map((extraction) => (
                    <tr key={extraction.id} className="hover:bg-[#0F0]/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-[#0F0]">{extraction.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{formatDate(extraction.date)}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{extraction.type}</td>
                      <td className="px-6 py-4">
                        {extraction.status === 'completed' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0F0]/10 text-[#0F0]">
                            Completed
                          </span>
                        ) : extraction.status === 'in_progress' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-400">
                              In Progress
                            </span>
                            <div className="w-24 h-1 bg-[#0F0]/20 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#0F0] transition-all duration-300"
                                style={{ width: `${(extraction.count ? (extraction.count / extraction.count) * 100 : 0)}%` }}
                              />
                            </div>
                          </div>
                        ) : extraction.status === 'failed' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-400/10 text-red-400">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {extraction.status === 'completed' && (
                            <Button
                              variant="secondary"
                              className="w-full text-xs bg-[#0F0]/5 hover:bg-[#0F0]/10 border-[#0F0]/30 hover:border-[#0F0]/50 text-[#0F0] transition-all duration-300 flex items-center justify-center gap-1.5"
                              onClick={() => handleDownload(extraction.id)}
                            >
                              <Download className="w-3 h-3" />
                              Download CSV
                            </Button>
                          )}
                          {extraction.status === 'failed' && (
                            <div className="w-full px-3 py-1.5 text-xs text-red-400 bg-red-400/5 border border-red-400/30 rounded-lg flex items-center justify-center gap-1.5">
                              <AlertCircle className="w-3 h-3" />
                              {extraction.error || 'An error occurred during extraction'}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataExport;