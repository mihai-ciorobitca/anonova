import React from 'react';
import { Coins } from 'lucide-react';

interface CreditsBarProps {
  credits: number;
  maxResults?: number;
}

const CreditsBar: React.FC<CreditsBarProps> = ({ credits, maxResults }) => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-b border-[#0F0]/20 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-end">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-[#0F0]/30">
            <Coins className="w-5 h-5 text-[#0F0]" />
            <span className="text-[#0F0] font-mono">{credits} credits</span>
          </div>
          {maxResults && (
            <div className="text-gray-400 text-sm">
              ({maxResults} results per extraction)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditsBar;
