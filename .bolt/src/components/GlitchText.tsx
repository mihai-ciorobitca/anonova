import React from 'react';
import { useTranslation } from 'react-i18next';

interface GlitchTextProps {
  text: string;
  className?: string;
  translateKey?: string;
  translateValues?: Record<string, any>;
}

const GlitchText: React.FC<GlitchTextProps> = ({ text, className = '', translateKey, translateValues }) => {
  const { t } = useTranslation();
  
  // If a translation key is provided, use it to get the translated text
  const displayText = translateKey ? t(translateKey, translateValues) : text;

  return (
    <div className={`relative ${className}`}>
      <div className="relative inline-block">
        <span className="absolute top-0 left-0 -translate-x-[2px] translate-y-[2px] text-[#0f0] opacity-70 animate-glitch1">
          {displayText}
        </span>
        <span className="absolute top-0 left-0 translate-x-[2px] -translate-y-[2px] text-[#f00] opacity-70 animate-glitch2">
          {displayText}
        </span>
        <span className="relative">{displayText}</span>
      </div>
    </div>
  );
};

export default GlitchText;
