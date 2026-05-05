import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UserCircleIcon, IdentificationIcon, BuildingOfficeIcon, CurrencyDollarIcon, CalendarDaysIcon, ArrowRightOnRectangleIcon, DocumentDuplicateIcon, CheckCircleIcon, PlusIcon, ClockIcon, LinkIcon } from '@heroicons/react/24/outline';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

const EmployeeDashboard = ({ employeeId, onLogout }) => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
  const [leaves, setLeaves] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [balances, setBalances] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [newRequest, setNewRequest] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
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

  useEffect(() => {
    const fetchData = async () => {
      if (!employeeId) return;
      setLoading(true);
      try {
        // Fetch employee first as it is critical
        const empRes = await api.get(`/employees/${employeeId}`);
        setEmployee(empRes.data);

        // Fetch others separately so one failure doesn't block the whole dashboard
        api.get('/leaves/requests', { params: { employee_id: employeeId } })
          .then(res => setLeaves(res.data))
          .catch(err => console.error("Error fetching leaves:", err));

        api.get('/payroll/history', { params: { employee_id: employeeId } })
          .then(res => setPayslips(res.data))
          .catch(err => console.error("Error fetching payslips:", err));

        api.get(`/attendance/${employeeId}`)
          .then(res => setAttendance(res.data))
          .catch(err => console.error("Error fetching attendance:", err));

        api.get(`/leaves/balance/${employeeId}`)
          .then(res => setBalances(res.data))
          .catch(err => console.error("Error fetching balances:", err));
          
        api.get('/leaves/types')
          .then(res => setLeaveTypes(res.data))
          .catch(err => console.error("Error fetching types:", err));

      } catch (err) {
        console.error("Critical error fetching employee data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [employeeId]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/leaves/request', {
        ...newRequest,
        employee_id: employeeId
      });
      setShowRequestModal(false);
      setNewRequest({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
      // Refresh leaves
      const res = await api.get('/leaves/requests', { params: { employee_id: employeeId } });
      setLeaves(res.data);
    } catch (err) {
      alert("Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimelineSteps = (status) => {
    const steps = [
      { id: 'Pending', label: 'Manager Review', role: 'Manager' },
      { id: 'Manager Approved', label: 'HR Review', role: 'HR' },
      { id: 'HR Approved', label: 'Admin Review', role: 'Admin' },
      { id: 'Approved', label: 'Finalized', role: 'System' }
    ];
    
    if (status === 'Rejected') return [{ id: 'Rejected', label: 'Request Rejected', role: 'System', isError: true }];
    
    return steps;
  };

  const statusColors = { 
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', 
    'Manager Approved': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', 
    'HR Approved': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', 
    Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', 
    Rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' 
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-500 p-6">
        <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-700 max-w-md w-full animate-zoho-fade">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
             <UserCircleIcon className="w-12 h-12 text-rose-600 dark:text-rose-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Profile Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">We couldn't retrieve your profile data. Please try logging in again.</p>
          <button onClick={onLogout} className="btn-primary w-full">Return to Login</button>
        </div>
      </div>
    );
  }

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '0' : num.toLocaleString('en-IN');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 font-sans p-6 md:p-12 relative overflow-hidden">
      
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/10 dark:bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-400/10 dark:bg-teal-900/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="max-w-5xl mx-auto relative z-10 flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0067ff] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
            <span className="text-white">{localStorage.getItem('orgDomain')?.charAt(0).toUpperCase() || 'A'}</span>
            <span className="text-teal-400">P</span>
          </div>
          <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            {localStorage.getItem('orgDomain')?.split('.')[0].toUpperCase() || 'AdaptivePay'} <span className="text-slate-400 font-medium">Service</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-yellow-500 hover:scale-105 transition-all"
          >
            {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-sm shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto relative z-10 animate-zoho-fade">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile & Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0067ff] to-teal-400"></div>
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 shadow-inner border border-slate-200 dark:border-slate-700">
                  <UserCircleIcon className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{employee.name}</h1>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6">{employee.role}</p>
                <div className="inline-block px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-[0.2em]">
                  {employee.status}
                </div>
              </div>

              <div className="mt-10 space-y-5">
                <div className="flex justify-between items-center text-sm border-b border-slate-50 dark:border-slate-800/50 pb-4">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Employee ID</span>
                  <span className="font-black text-slate-700 dark:text-slate-200">EMP-{String(employee.employee_id).padStart(4, '0')}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-50 dark:border-slate-800/50 pb-4">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Department</span>
                  <span className="font-black text-slate-700 dark:text-slate-200">{employee.department}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Joined On</span>
                  <span className="font-black text-slate-700 dark:text-slate-200">{new Date(employee.joining_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0067ff] to-[#004dc0] rounded-[2.5rem] p-8 shadow-xl text-white relative overflow-hidden group">
              <CurrencyDollarIcon className="absolute -right-4 -bottom-4 w-28 h-28 opacity-10 group-hover:scale-110 transition-transform duration-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-80">Base Salary</p>
              <h2 className="text-4xl font-black mb-1">₹{formatCurrency(employee.base_salary)}</h2>
              <p className="text-xs font-bold opacity-60">Gross Monthly Payout</p>
            </div>
          </div>

          {/* Right Column: Leaves & Activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Leave Requests Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                    <CalendarDaysIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  My Leave Requests
                </h2>
                <button 
                  onClick={() => setShowRequestModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  <PlusIcon className="w-5 h-5" />
                  Request Leave
                </button>
              </div>
              
              <div className="space-y-6">
                {leaves.length > 0 ? (
                  leaves.slice(0, 5).map((l) => (
                    <div key={l.request_id} className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border border-transparent dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all group shadow-sm hover:shadow-md">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <p className="font-black text-slate-800 dark:text-slate-100 text-lg group-hover:text-indigo-600 transition-colors">{l.leave_type}</p>
                          <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">{l.start_date} → {l.end_date}</p>
                        </div>
                        <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${statusColors[l.status] || 'bg-slate-100 text-slate-500'}`}>
                          {l.status}
                        </div>
                      </div>
                      
                      {/* Hierarchy Timeline */}
                      <div className="relative pt-6">
                         <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-200 dark:bg-slate-700 -translate-y-1/2"></div>
                         <div className="relative flex justify-between">
                            {getTimelineSteps(l.status).map((step, idx) => {
                              const isCompleted = l.status === 'Approved' || 
                                (l.status === 'HR Approved' && idx < 3) ||
                                (l.status === 'Manager Approved' && idx < 2) ||
                                (l.status === 'Pending' && idx === 0);
                              const isCurrent = (l.status === 'Pending' && idx === 0) ||
                                (l.status === 'Manager Approved' && idx === 1) ||
                                (l.status === 'HR Approved' && idx === 2);
                                
                              return (
                                <div key={step.id} className="flex flex-col items-center gap-3 relative z-10">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                                    step.isError ? 'bg-rose-500 border-rose-200' :
                                    isCompleted ? 'bg-emerald-500 border-emerald-100 dark:border-emerald-900/50 text-white' :
                                    isCurrent ? 'bg-white dark:bg-slate-800 border-indigo-600 text-indigo-600 scale-125' :
                                    'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400'
                                  }`}>
                                    {step.isError ? <PlusIcon className="w-5 h-5 rotate-45" /> :
                                     isCompleted ? <CheckCircleIcon className="w-5 h-5" /> : 
                                     <ClockIcon className="w-5 h-5" />}
                                  </div>
                                  <div className="text-center">
                                    <p className={`text-[9px] font-black uppercase tracking-widest ${isCurrent ? 'text-indigo-600' : 'text-slate-400'}`}>{step.label}</p>
                                    <p className="text-[8px] font-bold text-slate-500/50 italic">{step.role}</p>
                                  </div>
                                </div>
                              );
                            })}
                         </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/20 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-400 font-bold text-sm italic">No leave requests initiated yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Leave Balances Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <IdentificationIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                Leave Balance Overview
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {balances.map((b) => (
                  <div key={b.leave_type_id} className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{b.leave_type}</p>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-black text-slate-800 dark:text-white">{b.total_days - b.used_days}</span>
                      <span className="text-xs text-slate-400 font-bold mb-1">/ {b.total_days} Days Left</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min(100, (b.used_days / b.total_days) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                Recent Attendance
              </h2>
              <div className="space-y-3">
                {attendance.length > 0 ? (
                  attendance.slice(0, 5).map((a) => (
                    <div key={a.attendance_id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${a.status === 'Present' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{new Date(a.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase ${a.status === 'Present' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'}`}>
                        {a.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-6">No recent attendance records.</p>
                )}
              </div>
            </div>

            {/* Payslips Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-4">
                <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                  <DocumentDuplicateIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                Recent Payslips
              </h2>
              <div className="space-y-4">
                {payslips.length > 0 ? (
                  payslips.slice(0, 3).map((p) => (
                    <div key={p.payroll_id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border border-transparent dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all group">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter text-lg">{p.month_year}</p>
                          {p.status === 'Stored in Blockchain' && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800/50 animate-pulse">
                              <LinkIcon className="w-3 h-3" />
                              Blockchain Verified
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-black mt-1">NET PAYABLE: INR {formatCurrency(p.net_salary)}</p>
                      </div>
                      <button 
                        onClick={async () => {
                          try {
                            const res = await api.get(`/payroll/payslip/${p.payroll_id}/download`, { responseType: 'blob' });
                            const url = window.URL.createObjectURL(new Blob([res.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `payslip_${p.month_year}.pdf`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } catch (err) {
                            alert("Failed to download payslip.");
                          }
                        }}
                        className="bg-white dark:bg-slate-700 text-[#0067ff] dark:text-indigo-400 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95 border border-slate-100 dark:border-slate-600"
                      >
                        Download PDF
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/20 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-400 font-bold text-sm italic">No processed payslips available.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
        
        {/* Footer info */}
        <div className="mt-16 text-center text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 dark:text-slate-700">
           Immutable Cryptographic Ledger • AdaptivePay Enterprise 2026
        </div>
      </div>

      {/* Request Leave Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-lg w-full shadow-2xl border border-white/20 relative overflow-hidden animate-zoho-fade">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-teal-400"></div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Request Leave</h2>
            <p className="text-sm font-bold text-slate-400 mb-8">Fill in the details to start the approval hierarchy.</p>
            
            <form onSubmit={handleRequestSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Leave Type</label>
                <select 
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold focus:border-indigo-500 outline-none transition-all"
                  value={newRequest.leave_type_id}
                  onChange={(e) => setNewRequest({...newRequest, leave_type_id: e.target.value})}
                >
                  <option value="">Select a type</option>
                  {leaveTypes.map(t => (
                    <option key={t.leave_type_id} value={t.leave_type_id}>{t.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Start Date</label>
                  <input 
                    type="date" required
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold focus:border-indigo-500 outline-none"
                    value={newRequest.start_date}
                    onChange={(e) => setNewRequest({...newRequest, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">End Date</label>
                  <input 
                    type="date" required
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold focus:border-indigo-500 outline-none"
                    value={newRequest.end_date}
                    onChange={(e) => setNewRequest({...newRequest, end_date: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Reason</label>
                <textarea 
                  required rows="3"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold focus:border-indigo-500 outline-none resize-none"
                  placeholder="Why are you taking leave?"
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                ></textarea>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={isSubmitting}
                  className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20 hover:-translate-y-1 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
