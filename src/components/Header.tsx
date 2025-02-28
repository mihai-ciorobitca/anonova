import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Terminal, Users, Menu, ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Header = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentRoute = location.pathname.split('/').filter(Boolean);
  const discordUrl = 'https://discord.gg/your-discord-invite';

  // Don't show header on dashboard pages since they have their own navigation
  if (location.pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-sm border-b border-[#0F0]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between relative">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-400 hover:text-[#0F0] transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link 
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity ml-4 md:ml-0"
          >
            <Terminal className="w-6 h-6 text-[#0F0]" />
            <span className="text-[#0F0] font-bold">ANONOVA</span>
          </Link>

          {/* Mobile Breadcrumb */}
          {currentRoute.length > 0 && (
            <div className="md:hidden flex items-center gap-2 overflow-x-auto whitespace-nowrap">
              <ChevronRight className="w-4 h-4 text-gray-600" />
              {currentRoute.map((route, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRight className="w-4 h-4 text-gray-600" />}
                  <Link
                    to={`/${currentRoute.slice(0, index + 1).join('/')}`}
                    className="text-gray-400 hover:text-[#0F0] transition-colors capitalize"
                  >
                    {route}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard"
                  className="text-base text-[#0F0] hover:text-[#0F0]/80 transition-all duration-300 hover:animate-[glitch_0.3s_ease-in-out] relative after:absolute after:inset-0 after:bg-[#0F0]/20 after:blur-lg after:opacity-0 hover:after:opacity-100 after:transition-opacity"
                >
                  {t('header.dashboard')}
                </Link>
                <Link 
                  to="/start-scraping"
                  className="text-base text-[#0F0] hover:text-[#0F0]/80 transition-all duration-300 hover:animate-[glitch_0.3s_ease-in-out]"
                >
                  {t('header.newExtraction')}
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/features"
                  className="text-base text-gray-400 hover:text-[#0F0] transition-colors"
                >
                  {t('header.features')}
                </Link>
                <Link 
                  to="/pricing"
                  className="text-base text-gray-400 hover:text-[#0F0] transition-colors"
                >
                  {t('header.pricing')}
                </Link>
                <Link 
                  to="/start-scraping"
                  className="text-base text-[#0F0] hover:opacity-80 transition-opacity"
                >
                  {t('header.startScraping')}
                </Link>
              </>
            )}
            <a 
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-base text-gray-400 hover:text-[#0F0] transition-all duration-300 group"
            >
              <Users className="w-5 h-5 group-hover:text-[#0F0] group-hover:animate-pulse transition-all duration-300" />
              <span className="relative">
                {isAuthenticated ? t('header.community') : t('header.joinCommunity')}
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0F0] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </span>
            </a>
            <LanguageSwitcher />
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="absolute top-full right-0 w-full md:hidden bg-black/95 backdrop-blur-sm border border-[#0F0]/20 rounded-b-lg mt-1">
              <div className="py-2">
                {isAuthenticated ? (
                  <>
                    <Link 
                      to="/dashboard"
                      className="block px-4 py-2 text-[#0F0] hover:bg-[#0F0]/10 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('header.dashboard')}
                    </Link>
                    <Link 
                      to="/start-scraping"
                      className="block px-4 py-2 text-[#0F0] hover:bg-[#0F0]/10 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('header.newExtraction')}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/features"
                      className="block px-4 py-2 text-gray-400 hover:text-[#0F0] hover:bg-[#0F0]/10 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('header.features')}
                    </Link>
                    <Link 
                      to="/pricing"
                      className="block px-4 py-2 text-gray-400 hover:text-[#0F0] hover:bg-[#0F0]/10 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('header.pricing')}
                    </Link>
                    <Link 
                      to="/start-scraping"
                      className="block px-4 py-2 text-[#0F0] hover:bg-[#0F0]/10 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('header.startScraping')}
                    </Link>
                  </>
                )}
                <a 
                  href={discordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-gray-400 hover:text-[#0F0] hover:bg-[#0F0]/10 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {isAuthenticated ? t('header.community') : t('header.joinCommunity')}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;