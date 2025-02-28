import React, { useState, useRef, useEffect } from 'react';
import { Terminal, CreditCard, History, Download, Settings, Users, Wallet, Home, HelpCircle, LogOut, User, MessageSquare, Menu, ChevronRight, Zap } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import MatrixBackground from '../MatrixBackground';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import NavigationButtons from '../NavigationButtons';

const DashboardLayout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { setIsAuthenticated, setIsVerified, user } = useAuth();
  const { credits, loading: creditsLoading } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Get current route for breadcrumb
  const currentRoute = location.pathname.split('/').filter(Boolean);
  
  const navigation = [
    { name: t('dashboard.overview'), path: '/dashboard', icon: Terminal },
    { name: t('dashboard.extraction'), path: '/dashboard/extraction', icon: Zap },
    { name: t('dashboard.orders'), path: '/dashboard/orders', icon: History },
    { name: t('dashboard.subscription'), path: '/dashboard/subscription', icon: CreditCard },
    { name: t('dashboard.credits'), path: '/dashboard/credits', icon: Wallet },
    { name: t('dashboard.export'), path: '/dashboard/export', icon: Download },
    { name: t('dashboard.settings'), path: '/dashboard/settings', icon: Settings },
    { name: t('dashboard.referrals'), path: '/dashboard/referrals', icon: Users },
    { name: t('dashboard.support'), path: '/dashboard/support', icon: MessageSquare },
  ];
  
  // Generate a consistent support ID for the user
  const supportId = user?.user_metadata?.support_id || 'ANV-24031501';

  // Use actual user data
  const userData = {
    firstName: user?.user_metadata?.first_name || 'Guest',
    lastName: user?.user_metadata?.last_name || 'User',
    email: user?.email || 'guest@example.com',
    avatar: user?.user_metadata?.avatar_url || null,
    initials: ((user?.user_metadata?.first_name?.[0] || 'G') + (user?.user_metadata?.last_name?.[0] || 'U')).toUpperCase()
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsVerified(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono relative">
      <MatrixBackground />
      
      {/* Mobile Breadcrumb Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-[#0F0]/20">
        <div className="p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-400 hover:text-[#0F0] transition-colors flex items-center gap-2"
            >
              <Terminal className="w-6 h-6" />
              <span className="text-sm">{isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}</span>
            </button>
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
              <Link to="/" className="text-gray-400 hover:text-[#0F0] transition-colors">
                <Home className="w-4 h-4" />
              </Link>
              {currentRoute.map((route, index) => (
                <React.Fragment key={index}>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                  <Link
                    to={`/${currentRoute.slice(0, index + 1).join('/')}`}
                    className="text-gray-400 hover:text-[#0F0] transition-colors capitalize"
                  >
                    {route}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Sidebar - Hidden on Mobile */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-black/80 backdrop-blur-sm border-r border-[#0F0]/20 transform transition-transform duration-300 ease-in-out z-40 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6">
          <Link 
            to="/" 
            className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity"
          >
            <Terminal className="w-8 h-8 text-[#0F0]" />
            <span className="text-[#0F0] font-bold text-xl">ANONOVA</span>
          </Link>
          
          <nav className="space-y-1">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#0F0]/5 hover:text-[#0F0] transition-all group relative overflow-hidden"
            >
              <Home className="w-5 h-5" />
              <span>{t('header.backToHome')}</span>
            </Link>
            <div className="border-t border-[#0F0]/20 my-4" />
            {navigation.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                    isActive 
                      ? 'bg-[#0F0]/10 text-[#0F0]' 
                      : 'text-gray-400 hover:bg-[#0F0]/5 hover:text-[#0F0]'
                  }`}
                >
                  {/* Glitch effect on hover */}
                  <div className="absolute inset-0 bg-[#0F0]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {isActive && (
                    <div className="absolute right-0 w-1 h-full bg-[#0F0] animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-0 md:ml-64' : 'ml-0'} mt-16 md:mt-0`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-sm border-b border-[#0F0]/20 hidden md:block">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-gray-400 hover:text-[#0F0] transition-colors flex items-center gap-2"
              >
                <Menu className="w-6 h-6" />
                <span className="text-sm">{isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}</span>
              </button>
              <NavigationButtons />
            </div>
            
            <div className="flex items-center gap-6">
              {/* Support ID */}
              <div className="flex items-center gap-2 px-4 py-2 bg-[#0F0]/5 rounded-full border border-[#0F0]/20">
                <HelpCircle className="w-4 h-4 text-[#0F0]" />
                <span className="text-[#0F0] text-sm font-mono">Support ID: {supportId}</span>
              </div>
              
              {/* Credits */}
              <div className="flex items-center gap-2 px-4 py-2 bg-black rounded-full border border-[#0F0]/20">
                <span className="text-[#0F0] font-mono">
                  {creditsLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-pulse">Loading credits</span>
                      <span className="animate-pulse">...</span>
                    </span>
                  ) : (
                    `${credits} ${t('dashboard.credits')}`
                  )}
                </span>
              </div>
              
              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 rounded-full bg-[#0F0]/20 text-[#0F0] flex items-center justify-center hover:bg-[#0F0]/30 transition-colors overflow-hidden border border-[#0F0]/30"
                >
                  {userData.avatar ? (
                    <img 
                      src={userData.avatar} 
                      alt={`${userData.firstName} ${userData.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{userData.initials}</span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-black/90 backdrop-blur-sm border border-[#0F0]/20 rounded-xl shadow-lg py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-[#0F0]/20">
                      <div className="font-semibold text-[#0F0]">{userData.firstName} {userData.lastName}</div>
                      <div className="text-sm text-gray-400">{userData.email}</div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to="/dashboard/settings"
                        className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-[#0F0]/10 hover:text-[#0F0] transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        {t('dashboard.profileSettings')}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('auth.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;