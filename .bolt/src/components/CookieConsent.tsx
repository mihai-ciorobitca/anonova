import React, { useState, useEffect } from 'react';
import { Cookie, X, ChevronDown, ChevronUp, Shield, FlipVertical as Analytics, Cog } from 'lucide-react';
import Button from './Button';

interface CookieSettings {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>({
    necessary: true, // Always true and cannot be changed
    analytics: true,
    marketing: true,
    preferences: true
  });

  useEffect(() => {
    // Check if user has already made cookie choices
    const cookieChoices = localStorage.getItem('cookieConsent');
    if (!cookieChoices) {
      setShowConsent(true);
    } else {
      setSettings(JSON.parse(cookieChoices));
    }
  }, []);

  const handleAcceptAll = () => {
    const allEnabled = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    setSettings(allEnabled);
    localStorage.setItem('cookieConsent', JSON.stringify(allEnabled));
    setShowConsent(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(settings));
    setShowConsent(false);
  };

  const handleRejectAll = () => {
    const allDisabled = {
      necessary: true, // Always true
      analytics: false,
      marketing: false,
      preferences: false
    };
    setSettings(allDisabled);
    localStorage.setItem('cookieConsent', JSON.stringify(allDisabled));
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-black/90 backdrop-blur-sm border border-[#0F0]/30 rounded-xl p-6 shadow-lg">
          {/* Close button */}
          <button
            onClick={() => setShowConsent(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-[#0F0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Main Content */}
          <div className="flex items-start gap-4">
            <Cookie className="w-8 h-8 text-[#0F0] flex-shrink-0 mt-1" />
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="text-xl font-bold text-[#0F0] mb-2">Cookie Settings</h3>
                <p className="text-gray-400">
                  We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                  Please select your preferences below.
                </p>
              </div>

              {/* Cookie Settings */}
              <div className="space-y-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-[#0F0] hover:opacity-80 transition-opacity"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show Details
                    </>
                  )}
                </button>

                {showDetails && (
                  <div className="space-y-4 pt-2">
                    {/* Necessary Cookies */}
                    <div className="flex items-start gap-4 p-4 border border-[#0F0]/20 rounded-lg">
                      <Shield className="w-5 h-5 text-[#0F0] mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold">Necessary Cookies</div>
                          <input
                            type="checkbox"
                            checked={settings.necessary}
                            disabled
                            className="w-4 h-4 border-2 border-[#0F0]/50 rounded bg-black text-[#0F0] focus:ring-[#0F0] focus:ring-offset-0 cursor-not-allowed"
                          />
                        </div>
                        <p className="text-sm text-gray-400">
                          Essential for the website to function properly. Cannot be disabled.
                        </p>
                      </div>
                    </div>

                    {/* Analytics Cookies */}
                    <div className="flex items-start gap-4 p-4 border border-[#0F0]/20 rounded-lg">
                      <Analytics className="w-5 h-5 text-[#0F0] mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold">Analytics Cookies</div>
                          <input
                            type="checkbox"
                            checked={settings.analytics}
                            onChange={(e) => setSettings(prev => ({ ...prev, analytics: e.target.checked }))}
                            className="w-4 h-4 border-2 border-[#0F0]/50 rounded bg-black text-[#0F0] focus:ring-[#0F0] focus:ring-offset-0"
                          />
                        </div>
                        <p className="text-sm text-gray-400">
                          Help us understand how visitors interact with our website.
                        </p>
                      </div>
                    </div>

                    {/* Marketing Cookies */}
                    <div className="flex items-start gap-4 p-4 border border-[#0F0]/20 rounded-lg">
                      <Analytics className="w-5 h-5 text-[#0F0] mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold">Marketing Cookies</div>
                          <input
                            type="checkbox"
                            checked={settings.marketing}
                            onChange={(e) => setSettings(prev => ({ ...prev, marketing: e.target.checked }))}
                            className="w-4 h-4 border-2 border-[#0F0]/50 rounded bg-black text-[#0F0] focus:ring-[#0F0] focus:ring-offset-0"
                          />
                        </div>
                        <p className="text-sm text-gray-400">
                          Used to track visitors across websites to display relevant advertisements.
                        </p>
                      </div>
                    </div>

                    {/* Preferences Cookies */}
                    <div className="flex items-start gap-4 p-4 border border-[#0F0]/20 rounded-lg">
                      <Cog className="w-5 h-5 text-[#0F0] mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold">Preferences Cookies</div>
                          <input
                            type="checkbox"
                            checked={settings.preferences}
                            onChange={(e) => setSettings(prev => ({ ...prev, preferences: e.target.checked }))}
                            className="w-4 h-4 border-2 border-[#0F0]/50 rounded bg-black text-[#0F0] focus:ring-[#0F0] focus:ring-offset-0"
                          />
                        </div>
                        <p className="text-sm text-gray-400">
                          Enable the website to remember your preferences and customize your experience.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  className="flex-1"
                  onClick={handleAcceptAll}
                >
                  Accept All
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handleSavePreferences}
                >
                  Save Preferences
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handleRejectAll}
                >
                  Reject All
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
