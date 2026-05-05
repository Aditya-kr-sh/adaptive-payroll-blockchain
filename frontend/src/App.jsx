import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import {
  HomeIcon, UsersIcon, CalendarIcon, DocumentTextIcon,
  CurrencyDollarIcon, ChartBarIcon, LinkIcon, BeakerIcon,
  DocumentDuplicateIcon, CalculatorIcon, ArrowRightOnRectangleIcon,
  SunIcon, MoonIcon, Bars3Icon, XMarkIcon
} from '@heroicons/react/24/outline';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import Payslips from './pages/Payslips';
import Analytics from './pages/Analytics';
import BlockchainViewer from './pages/BlockchainViewer';
import TaxSlabs from './pages/TaxSlabs';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';

function App() {
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [isEmployee, setIsEmployee] = useState(localStorage.getItem('isEmployee') === 'true');
  const [employeeId, setEmployeeId] = useState(localStorage.getItem('employeeId') || null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const domain = localStorage.getItem('orgDomain');
    const token = localStorage.getItem('token');
    if ((isAdmin || isEmployee) && (!domain || !token)) {
      handleLogout();
    }
  }, [isAdmin, isEmployee]);

  const handleAdminLogin = () => {
    setIsAdmin(true);
    setIsEmployee(false);
  };

  const handleEmployeeLogin = (id) => {
    setIsEmployee(true);
    setIsAdmin(false);
    setEmployeeId(id);
    localStorage.setItem('employeeId', id);
    localStorage.setItem('isEmployee', 'true');
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAdmin(false);
    setIsEmployee(false);
    setEmployeeId(null);
    window.location.href = '/login'; // Force full refresh to clear all state
  };

  const isAuthenticated = isAdmin || isEmployee;

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        {!isAuthenticated && (
          <>
            <Route path="/login" element={<Login onAdminLogin={handleAdminLogin} onEmployeeLogin={handleEmployeeLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}

        {/* Unified Layout for Authenticated Users */}
        {isAuthenticated && (
          <Route
            path="/*"
            element={
              <div className="flex h-screen text-gray-800 dark:text-gray-100 font-sans overflow-hidden bg-slate-50 dark:bg-hr-darkBg transition-colors duration-500 relative">
                <Sidebar onLogout={handleLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className="flex-1 overflow-y-auto w-full relative pt-16 lg:pt-0">
                  {/* Mobile Top Header */}
                  <div className="lg:hidden fixed top-0 left-0 w-full bg-[#0a1b39] text-white p-4 flex items-center justify-between z-30 shadow-lg">
                    <div className="flex items-center gap-2">
                       <div className="p-1.5 bg-[#0067ff] rounded-md"><BeakerIcon className="w-5 h-5" /></div>
                       <span className="font-black">AdaptivePay</span>
                    </div>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-lg">
                       <Bars3Icon className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
                  <div className="px-4 sm:px-8 py-6 sm:py-10 max-w-7xl mx-auto min-h-full animate-fade-in-up">
                    <Routes>
                      {/* Shared Routes */}
                      <Route path="/attendance" element={<Attendance />} />
                      <Route path="/leaves" element={<Leaves />} />
                      <Route path="/payslips" element={<Payslips />} />
                      <Route path="/blockchain" element={<BlockchainViewer />} />

                      {/* Role Specific Homepages */}
                      {isAdmin ? (
                        <>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/employees" element={<Employees />} />
                          <Route path="/payroll" element={<Payroll />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/tax" element={<TaxSlabs />} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </>
                      ) : (
                        <>
                          <Route path="/" element={<EmployeeDashboard employeeId={employeeId} onLogout={handleLogout} />} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </>
                      )}
                    </Routes>
                  </div>
                </main>
              </div>
            }
          />
        )}
      </Routes>
    </Router>
  );
}

export default App;
