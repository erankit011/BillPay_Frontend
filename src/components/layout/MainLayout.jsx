import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Users, FileText, Mic, BarChart2, Settings, Menu, X, LogOut, Box, Bell, Globe } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const navItems = [
  { path: '/dashboard', labelKey: 'Dashboard', icon: Home },
  { path: '/customers', labelKey: 'Customers', icon: Users },
  { path: '/products', labelKey: 'Products', icon: Box },
  { path: '/bills', labelKey: 'Billing', icon: FileText },
  { path: '/reminders', labelKey: 'Reminders', icon: Bell },
  { path: '/voice', labelKey: 'Voice Entry', icon: Mic },
  { path: '/reports', labelKey: 'Reports', icon: BarChart2 },
  { path: '/settings', labelKey: 'Settings', icon: Settings },
];

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { t, i18n } = useTranslation();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const BASE_URL = API_URL.replace('/api/v1', '');

  const handleLogout = async () => {
    try {
      // Call logout endpoint to clear refresh token
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and dispatch logout action
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      dispatch(logout());
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:static lg:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 animate-fade-in">
          <span className="text-xl font-bold text-blue-600">BakiPay</span>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1 overflow-y-auto flex-1">
          {navItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center px-4 py-3 rounded-lg transition-all animate-slide-up ${isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:translate-x-1'}`
              }
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-200 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <button 
            onClick={toggleLanguage}
            className="flex items-center justify-center w-full px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all font-medium mb-3 btn-hover-lift"
          >
            <Globe className="w-5 h-5 mr-2" />
            {i18n.language === 'en' ? 'हिंदी' : 'English'}
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium btn-hover-lift"
          >
            <LogOut className="w-5 h-5 mr-3" />
            {t('Logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 animate-fade-in">
          <button 
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          
          <div className="ml-auto flex items-center gap-4">
            <button className="relative transition-transform hover:scale-110">
              <Bell className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>
            <Link to="/profile" className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold hover:bg-blue-200 transition-all overflow-hidden hover:scale-110">
              {user?.profileImage && user.profileImage !== 'no-photo.jpg' ? (
                <img src={`${BASE_URL}${user.profileImage}`} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || 'U'
              )}
            </Link>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden bg-white border-t border-gray-200 flex justify-around p-2">
          {navItems.slice(0, 5).map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex flex-col items-center p-2 rounded-lg transition-all animate-fade-in ${isActive ? 'text-blue-600' : 'text-gray-500'}`
              }
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default MainLayout;
