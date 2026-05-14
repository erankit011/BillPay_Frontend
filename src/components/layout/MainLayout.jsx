import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Users, FileText, Mic, BarChart2, Settings, Menu, X, LogOut, Box, Bell, Globe } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const navItems = [
  { path: '/', labelKey: 'Dashboard', icon: Home },
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

  const handleLogout = () => {
    dispatch(logout());
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans selection:bg-slate-100 selection:text-indigo-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-100 transform transition-transform duration-300 lg:static lg:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between h-20 px-8 border-b border-slate-100 shrink-0">
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">BakiPay</span>
          <button className="lg:hidden p-2 -mr-2 rounded-lg text-slate-400 hover:bg-slate-50" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1 overflow-y-auto flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-slate-100 text-slate-800 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.02)]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t shrink-0">
          <button 
            onClick={toggleLanguage}
            className="flex items-center justify-center w-full px-4 py-3 text-slate-800 bg-slate-100/50 hover:bg-slate-100 rounded-xl transition-all duration-200 font-semibold mb-3 border border-indigo-100/50"
          >
            <Globe className="w-5 h-5 mr-2" />
            {i18n.language === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium group"
          >
            <LogOut className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
            {t('Logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 lg:px-8 z-10 shrink-0 sticky top-0">
          <button 
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="ml-auto flex items-center gap-4">
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            {/* User Profile */}
            <Link to="/profile" className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold shadow-sm hover:ring-2 hover:ring-indigo-100 transition-all overflow-hidden border border-indigo-100">
              {user?.profileImage && user.profileImage !== 'no-photo.jpg' ? (
                <img src={`${BASE_URL}${user.profileImage}`} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || 'U'
              )}
            </Link>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 w-full bg-white border-t flex justify-around p-2 pb-safe z-20 shrink-0">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex flex-col items-center p-2 rounded-lg transition-colors ${isActive ? 'text-slate-800' : 'text-slate-500 hover:text-slate-800'}`
              }
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium whitespace-nowrap overflow-hidden text-ellipsis w-14 text-center">{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default MainLayout;
