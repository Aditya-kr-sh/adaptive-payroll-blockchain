import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon, UsersIcon, CalendarIcon, DocumentTextIcon,
  CurrencyDollarIcon, ChartBarIcon, LinkIcon, BeakerIcon,
  DocumentDuplicateIcon, CalculatorIcon, ArrowRightOnRectangleIcon,
  SunIcon, MoonIcon, Bars3Icon, XMarkIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ onLogout, isOpen, onClose }) => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const navItems = [
    { name: 'Dashboard', path: '/', icon: HomeIcon },
    { name: 'Employees', path: '/employees', icon: UsersIcon, adminOnly: true },
    { name: 'Attendance', path: '/attendance', icon: CalendarIcon },
    { name: 'Leaves', path: '/leaves', icon: DocumentTextIcon },
    { name: 'Payroll', path: '/payroll', icon: CurrencyDollarIcon, adminOnly: true },
    { name: 'Payslips', path: '/payslips', icon: DocumentDuplicateIcon },
    { name: 'Analytics', path: '/analytics', icon: ChartBarIcon, adminOnly: true },
    { name: 'Tax Slabs', path: '/tax', icon: CalculatorIcon, adminOnly: true },
    { name: 'Audit Log', path: '/blockchain', icon: LinkIcon },
  ].filter(item => !item.adminOnly || isAdmin);

  const [isDarkMode, setIsDarkMode] = React.useState(
    localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.theme = newTheme ? 'dark' : 'light';
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}
      
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-[#0a1b39] text-white flex flex-col h-full shadow-2xl z-[50] transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="p-2 bg-[#0067ff] rounded-lg shadow-lg group-hover:rotate-12 transition-transform">
              <BeakerIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">AdaptivePay</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-white/5 rounded-lg">
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => { if(window.innerWidth < 1024) onClose(); }}
              end={item.path === '/'}
              className={({ isActive }) =>
                `group flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-sm ${isActive
                  ? 'bg-[#0067ff] text-white shadow-xl shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="font-semibold tracking-wide">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer User */}
        <div className="p-6 bg-black/20 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-[#0067ff] flex-shrink-0 flex items-center justify-center text-white font-black shadow-lg">
                {localStorage.getItem('userName')?.charAt(0) || 'A'}
              </div>
              <div className="truncate">
                <p className="text-sm font-bold truncate">
                  {localStorage.getItem('userName') || 'Administrator'}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-80">
                  {localStorage.getItem('orgDomain')?.split('.')[0] || 'AdaptivePay'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-white/5 rounded-lg transition-all"
                title="Toggle Theme"
              >
                {isDarkMode ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5" />}
              </button>
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>

  );
};
export default Sidebar;
