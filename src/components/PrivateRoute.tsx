import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isVerified, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#0F0] text-lg">
          <span className="inline-flex items-center gap-2">
            <span className="animate-pulse">Loading</span>
            <span className="animate-pulse">...</span>
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/start-scraping" />;
  }

  if (!isVerified) {
    return <Navigate to="/verify-email" />;
  }

  return <>{children}</>;
}

export default PrivateRoute;