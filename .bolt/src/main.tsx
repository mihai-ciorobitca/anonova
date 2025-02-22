import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import { OnboardingProvider } from './contexts/OnboardingContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <UserProvider>
        <OnboardingProvider>
          <App />
        </OnboardingProvider>
      </UserProvider>
    </AuthProvider>
  </StrictMode>
);
