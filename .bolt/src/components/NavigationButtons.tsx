import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Button from './Button';

interface NavigationButtonsProps {
  backPath?: string;
  forwardPath?: string;
  className?: string;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({ backPath, forwardPath, className = '' }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  const handleForward = () => {
    if (forwardPath) {
      navigate(forwardPath);
    } else {
      navigate(1);
    }
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Button
        variant="secondary"
        onClick={handleBack}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      <Button
        variant="secondary"
        onClick={handleForward}
        className="flex items-center gap-2"
      >
        Forward
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default NavigationButtons;
