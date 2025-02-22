import React, { useState } from 'react';
import { Terminal, Users, Wallet, Download, Shield, Zap, X } from 'lucide-react';
import Button from './Button';
import GlitchText from './GlitchText';

interface Step {
  title: string;
  description: string;
  video?: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  {
    title: 'Welcome to Anonova',
    description: 'The ultimate data extraction tool. Let\'s show you how to dominate the algorithm.',
    icon: Terminal,
    video: 'https://your-cdn.com/videos/welcome.mp4'
  },
  {
    title: 'Start Extracting',
    description: 'Learn how to extract data from profiles and hashtags with just a few clicks.',
    icon: Zap,
    video: 'https://your-cdn.com/videos/extraction.mp4'
  },
  {
    title: 'Manage Credits',
    description: 'See how to purchase and manage your extraction credits.',
    icon: Wallet,
    video: 'https://your-cdn.com/videos/credits.mp4'
  },
  {
    title: 'Download Data',
    description: 'Export your extracted data in CSV format.',
    icon: Download,
    video: 'https://your-cdn.com/videos/export.mp4'
  }
];

interface OnboardingTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleComplete = () => {
    setIsClosing(true);
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  const handleSkip = () => {
    setIsClosing(true);
    setTimeout(() => {
      onSkip();
    }, 500);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
      isClosing ? 'opacity-0' : 'opacity-100'
    }`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative max-w-2xl w-full mx-4">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-[#0F0] transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Step content */}
        <div className="bg-black/80 border border-[#0F0]/30 rounded-xl p-8 space-y-6">
          {/* Progress bar */}
          <div className="w-full h-1 bg-[#0F0]/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#0F0] transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Step indicator */}
          <div className="text-sm text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </div>

          {/* Icon */}
          <div className="flex justify-center">
            {React.createElement(steps[currentStep].icon, {
              className: "w-16 h-16 text-[#0F0] animate-[float_4s_ease-in-out_infinite]"
            })}
          </div>

          {/* Title */}
          <GlitchText 
            text={steps[currentStep].title}
            className="text-3xl font-bold text-center"
          />

          {/* Description */}
          <p className="text-gray-400 text-center text-lg">
            {steps[currentStep].description}
          </p>

          {/* Video */}
          {steps[currentStep].video && (
            <div className="relative aspect-video rounded-lg overflow-hidden border border-[#0F0]/30">
              <video
                src={steps[currentStep].video}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center pt-4">
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-[#0F0] transition-colors"
            >
              Skip Tutorial
            </button>
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next Step'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial;
