import React, { useState } from 'react';
import { CreditCard, Bitcoin, Wallet, Shield, Zap, RefreshCw, Info, X, Clock, Check } from 'lucide-react';
import Button from '../Button';
import GlitchText from '../GlitchText';
import LegalNotices from '../LegalNotices';

const BuyCredits = () => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <LegalNotices 
          type="purchase"
          className="mt-6"
        />

        <Button 
          className="w-full mt-4" 
          disabled={!agreedToTerms}
        >
          Complete Purchase
        </Button>
      </div>
    </div>
  );
};

export default BuyCredits;
