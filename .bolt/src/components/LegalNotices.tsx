import React, { useState } from 'react';
import { Shield, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import Button from './Button';

interface LegalNoticesProps {
  type: 'extraction' | 'purchase';
  className?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

const LegalNotices: React.FC<LegalNoticesProps> = ({ type, className = '', checked, onChange }) => {
  const [showTerms, setShowTerms] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);

  const handleShowTerms = () => {
    setShowTerms(true);
  };

  const handleAcceptTerms = () => {
    setHasReadTerms(true);
    setShowTerms(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {type === 'extraction' && onChange !== undefined && (
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center mt-1">
            <input
              type="checkbox"
              className="w-5 h-5 border-2 border-[#0F0]/50 rounded bg-black text-[#0F0] focus:ring-[#0F0] focus:ring-offset-0"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              disabled={!hasReadTerms}
            />
          </div>
          <div className="space-y-2">
            <span className="text-sm text-gray-400 group-hover:text-gray-300">
              I understand and agree to the terms of service and liability disclaimer.
            </span>
            {!hasReadTerms && (
              <button
                onClick={handleShowTerms}
                className="text-[#0F0] text-sm hover:underline flex items-center gap-1"
              >
                <ChevronDown className="w-4 h-4" />
                Click to read terms
              </button>
            )}
            {hasReadTerms && (
              <div className="text-sm text-[#0F0]/70">
                <ChevronUp className="w-4 h-4 inline mr-1" />
                Terms read and acknowledged
              </div>
            )}
          </div>
        </label>
      )}

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowTerms(false)}
          />
          
          <div className="relative bg-black/90 border border-[#0F0]/30 rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setShowTerms(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-[#0F0] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-[#0F0]">Terms of Service & Liability Disclaimer</h3>
              
              <div className="p-4 border border-yellow-400/20 rounded-lg bg-yellow-400/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div className="space-y-4 text-sm">
                    <p className="text-yellow-400 font-semibold">Important Legal Notice:</p>
                    
                    <div className="space-y-6 text-yellow-400/80">
                      <div className="space-y-2">
                        <h4 className="font-semibold">No Representations or Warranties; Limitations on Liability</h4>
                        <p>
                          The information and materials on Anonova may contain technical inaccuracies or typographical errors. Changes are periodically made to the information contained herein. Anonova MAKES NO REPRESENTATIONS OR WARRANTIES WITH RESPECT TO ANY INFORMATION, MATERIALS, OR GRAPHICS ON THE WEBSITE, ALL OF WHICH ARE PROVIDED ON A STRICTLY "AS IS" BASIS, WITHOUT WARRANTY OF ANY KIND. Anonova HEREBY EXPRESSLY DISCLAIMS ALL WARRANTIES WITH REGARD TO ANY INFORMATION, MATERIALS, OR GRAPHICS ON THE WEBSITE, INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. UNDER NO CIRCUMSTANCES SHALL THE SITE OWNER OR PUBLISHER BE LIABLE UNDER ANY THEORY OF RECOVERY, AT LAW OR IN EQUITY, FOR ANY DAMAGES, INCLUDING, BUT NOT LIMITED TO, SPECIAL, DIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF USE OR LOST PROFITS) ARISING OUT OF OR IN ANY MANNER CONNECTED WITH THE USE OF INFORMATION OR SERVICES, OR THE FAILURE TO PROVIDE INFORMATION OR SERVICES, FROM THE WEBSITE.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold">Links to Third-Party Websites</h4>
                        <p>
                          We may provide hyperlinks to third-party websites as a convenience to users of our site. Anonova does not control third-party websites and is not responsible for the contents of any linked third-party websites, or any hyperlink within a linked website. Anonova does not endorse, recommend, or approve any third-party website hyperlinked from the website. Anonova assumes no liability for the content or use of any information available through such hyperlinks.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold">Service Guarantee Policy</h4>
                        <p>
                          All services provided through Anonova come with a limited warranty period of 24-72 hours. This means that we guarantee the functionality of services purchased on our site within the specified period. Anonova assumes no responsibility for any issues, limitations, or restrictions imposed on the data or services after the specified period. We will not be responsible for any loss, limitation, or restriction resulting from external factors beyond our control. Users assume full responsibility for the data and services obtained through our platform.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold">Refund Policy</h4>
                        <p>
                          Due to the nature of digital services, Anonova does not issue refunds once an order is confirmed and the service is delivered. If you experience any issues, we recommend contacting our support team for assistance.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold">Changes to These Terms of Use</h4>
                        <p>
                          Anonova reserves the right to modify or update these Terms of Use at any time by posting new Terms of Use on this page. If you have any questions regarding these Terms of Use, you may contact us at support@anonova.ai.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold">Disclaimer</h4>
                        <p>
                          The Anonova service acts as an intermediary for data extraction and automation. Users are solely responsible for how they use the data extracted through our platform. Anonova does not approve or support any illegal activities, including but not limited to, spamming (commercial emailing without prior recipient consent) or any fraudulent activities using the extracted data.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold">Important Notice</h4>
                        <p>
                          A limited guarantee applies to the services offered. No replacements or refunds will be provided after the 24-72 hour guarantee period. Users acknowledge that they assume full responsibility for any risks associated with using the data obtained through Anonova.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold">User Responsibility</h4>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>You are solely responsible for ensuring your use of extracted data complies with Instagram's terms of service.</li>
                          <li>You must comply with all applicable laws and regulations in your jurisdiction.</li>
                          <li>You are responsible for obtaining any necessary permissions for data extraction and usage.</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold">Data Protection</h4>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>You must comply with data protection regulations (including but not limited to GDPR).</li>
                          <li>You are responsible for ensuring legal basis for processing personal data.</li>
                          <li>You must handle extracted data in accordance with privacy laws.</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold">Prohibited Uses</h4>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Extracted data must not be used for spam or harassment.</li>
                          <li>Any illegal activities or malicious use is strictly prohibited.</li>
                          <li>Data must not be used to cause harm or damage to individuals or organizations.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm text-gray-400">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  By clicking "Accept & Continue", you confirm that you have read, understood, and agree to these terms.
                </div>
              </div>
              
              <Button
                className="w-full mt-6"
                onClick={handleAcceptTerms}
              >
                Accept & Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {type === 'purchase' && (
        <div className="flex items-start gap-2 text-sm text-yellow-400">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            All credit purchases are final and non-refundable. Credits cannot be transferred or exchanged for cash value.
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 text-sm text-gray-400">
        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          By proceeding, you agree to our{' '}
          <a 
            href="/terms" 
            target="_blank"
            className="text-[#0F0] hover:underline"
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('showTerms'));
            }}
          >
            Terms and Conditions
          </a>
          {' '}and{' '}
          <a 
            href="/privacy" 
            target="_blank"
            className="text-[#0F0] hover:underline"
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('showPrivacy'));
            }}
          >
            Privacy Policy
          </a>
          .
        </div>
      </div>
    </div>
  );
};

export default LegalNotices;
