import React, { createContext, useContext, useState, useEffect } from 'react';

interface OnboardingContextType {
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (value: boolean) => void;
  showOnboarding: boolean;
  setShowOnboarding: (value: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const completed = localStorage.getItem('hasCompletedOnboarding') === 'true';
    setHasCompletedOnboarding(completed);
    
    // Show onboarding if not completed
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  return (
    <OnboardingContext.Provider value={{
      hasCompletedOnboarding,
      setHasCompletedOnboarding,
      showOnboarding,
      setShowOnboarding,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
