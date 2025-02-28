import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardHome from "./components/dashboard/DashboardHome";
import ExtractionPage from "./components/dashboard/ExtractionPage";
import OrdersHistory from "./components/dashboard/OrdersHistory";
import MySubscription from "./components/dashboard/MySubscription";
import MyCredits from "./components/dashboard/MyCredits";
import DataExport from "./components/dashboard/DataExport";
import SettingsPage from "./components/dashboard/SettingsPage";
import ReferralsPage from "./components/dashboard/ReferralsPage";
import SupportPage from "./components/dashboard/SupportPage";
import MatrixBackground from "./components/MatrixBackground";
import GlitchText from "./components/GlitchText";
import Button from "./components/Button";
import PricingPage from "./components/PricingPage";
import StartScrapingPage from "./components/StartScrapingPage";
import DemoPage from "./components/DemoPage";
import FeaturesPage from "./components/FeaturesPage";
import FeatureDetailPage from "./components/FeatureDetailPage";
import VerifyEmail from "./components/VerifyEmail";
import PrivateRoute from "./components/PrivateRoute";
import Header from "./components/Header";
import OnboardingTutorial from "./components/OnboardingTutorial";
import { Link } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useOnboarding } from "./contexts/OnboardingContext";
import CookieConsent from "./components/CookieConsent";
import { useTranslation } from "react-i18next";

// Create a separate HomePage component to use hooks
const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-4xl mx-auto">
        <GlitchText
          text={t("home.title")}
          className="text-4xl md:text-6xl font-bold leading-tight"
        />
        <p className="text-gray-400 text-xl max-w-2xl mx-auto">
          {t("home.subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/start-scraping">
            <Button className="w-full sm:w-auto">
              {isAuthenticated
                ? t("header.newExtraction")
                : t("home.startButton")}
            </Button>
          </Link>
          {!isAuthenticated && (
            <Link to="/demo">
              <Button variant="secondary" className="w-full sm:w-auto">
                {t("home.demoButton")}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-white font-mono">
        <MatrixBackground />
        <Header />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/features/:feature" element={<FeatureDetailPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/start-scraping" element={<StartScrapingPage />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="extraction" element={<ExtractionPage />} />
            <Route path="orders" element={<OrdersHistory />} />
            <Route path="subscription" element={<MySubscription />} />
            <Route path="credits" element={<MyCredits />} />
            <Route path="export" element={<DataExport />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="referrals" element={<ReferralsPage />} />
            <Route path="support" element={<SupportPage />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <CookieConsent />
      </div>
    </Router>
  );
}

export default App;
