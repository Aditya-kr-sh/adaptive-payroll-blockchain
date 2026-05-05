import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { DocumentTextIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const statusColors = { 
  Pending: 'badge-yellow', 
  'Manager Approved': 'badge-blue', 
  'HR Approved': 'badge-indigo', 
  Approved: 'badge-green', 
  Rejected: 'badge-red' 
};
const leaveColors = ['badge-blue', 'badge-purple', 'badge-green', 'badge-gray'];

const Leaves = () => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const employeeId = localStorage.getItem('employeeId');
  const userRole = localStorage.getItem('role') || '';

  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balance, setBalance] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('requests');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState(isAdmin ? '' : employeeId);
  const [form, setForm] = useState({
    employee_id: isAdmin ? '' : employeeId, 
    leave_type_id: '', 
    start_date: '', 
    end_date: '', 
    reason: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAll();
    if (!isAdmin) fetchBalance(employeeId);
  }, [filterStatus]);

  const fetchAll = async () => {
    const params = { status: filterStatus || undefined };
    if (!isAdmin) params.employee_id = employeeId;

    const [reqRes, empRes, typeRes] = await Promise.all([
      api.get('/leaves/requests', { params }),
      isAdmin ? api.get('/employees/') : Promise.resolve({ data: [] }),
      api.get('/leaves/types')
    ]);
    setRequests(reqRes.data);
    setEmployees(empRes.data);
    setLeaveTypes(typeRes.data);
  };

  const fetchBalance = async (empId) => {
    if (!empId) return;
    const res = await api.get(`/leaves/balance/${empId}`);
    setBalance(res.data);
  };

  const handleStatusChange = async (reqId, status) => {
    try {
      await api.put(`/leaves/${reqId}/status`, { status });
      showMsg(`Leave status updated successfully`);
      fetchAll();
    } catch (error) {
      showMsg(error.response?.data?.error || 'Hierarchy validation error', true);
    }
  };

  const canApprove = (status) => {
    if (userRole === 'Manager' && status === 'Pending') return true;
    if (userRole === 'HR' && status === 'Manager Approved') return true;
    if (userRole === 'Admin' && status === 'HR Approved') return true;
    return false;
  };

  const canReject = (status) => {
    return ['Pending', 'Manager Approved', 'HR Approved'].includes(status) && 
           ['Manager', 'HR', 'Admin', 'Admin'].includes(userRole);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/leaves/request', form);
    setShowModal(false);
    showMsg('✅ Leave request submitted successfully!');
    fetchAll();
    if (!isAdmin) fetchBalance(employeeId);
    setForm({ employee_id: isAdmin ? '' : employeeId, leave_type_id: '', start_date: '', end_date: '', reason: '' });
  };

  const showMsg = (msg, isError = false) => {
    setMessage({ text: msg, isError });
    setTimeout(() => setMessage(null), 3000);
  };

  const pending = requests.filter(r => r.status === 'Pending').length;
  const approved = requests.filter(r => r.status === 'Approved').length;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title gradient-text">{isAdmin ? 'Leave Management' : 'My Leaves'}</h1>
          <p className="page-subtitle">{isAdmin ? 'Manage leave requests, approvals, and balances' : 'View your leave history and balances'}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <DocumentTextIcon className="w-4 h-4" /> Request Leave
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: isAdmin ? 'Total Requests' : 'My Requests', value: requests.length, color: 'text-indigo-600', bg: 'bg-indigo-100' },
          { label: 'Pending Approval', value: pending, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Approved', value: approved, color: 'text-emerald-600', bg: 'bg-emerald-100' }
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`${s.bg} dark:bg-opacity-10 w-12 h-12 rounded-xl flex items-center justify-center`}>
              <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {message && (
        <div className={`${message.isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'} border px-4 py-3 rounded-xl text-sm font-medium`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100/80 dark:bg-slate-900/50 p-1 rounded-xl w-fit border border-transparent dark:border-slate-800">
        {['requests', 'balance'].map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'balance' && isAdmin) fetchBalance(selectedEmpId); }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab 
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm' 
                : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
            }`}>
            {tab === 'requests' ? (isAdmin ? '📋 Leave Requests' : '📋 My Requests') : (isAdmin ? '💰 Balance Overview' : '💰 My Balance')}
          </button>
        ))}
      </div>

      {/* Leave Requests */}
      {activeTab === 'requests' && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-800 dark:text-white">{isAdmin ? 'All Leave Requests' : 'My Leave History'}</h2>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-44">
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="mobile-table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>ID</th>{isAdmin && <th>Employee</th>}<th>Leave Type</th><th>Period</th><th>Days</th><th>Reason</th><th>Status</th>{isAdmin && <th>Actions</th>}</tr>
              </thead>
              <tbody>
                {requests.map(r => {
                  const days = Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1;
                  return (
                    <tr key={r.request_id}>
                      <td><span className="text-xs font-bold text-purple-600 dark:text-purple-400">#{String(r.employee_id).padStart(3, '0')}</span></td>
                      {isAdmin && (
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                              {r.employee_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-white text-xs">{r.employee_name}</p>
                              <p className="text-gray-400 dark:text-slate-500 text-xs">{r.department}</p>
                            </div>
                          </div>
                        </td>
                      )}
                      <td><span className="badge badge-purple">{r.leave_type}</span></td>
                      <td className="text-xs text-gray-600">
                        <p>{r.start_date}</p><p className="text-gray-400">to {r.end_date}</p>
                      </td>
                      <td><span className="font-bold text-indigo-600">{days}d</span></td>
                      <td className="text-gray-500 text-xs max-w-xs truncate">{r.reason || '—'}</td>
                      <td><span className={`badge ${statusColors[r.status]}`}>{r.status}</span></td>
                      {isAdmin && (
                        <td>
                          <div className="flex gap-1">
                            {canApprove(r.status) && (
                              <button onClick={() => handleStatusChange(r.request_id, 'Approved')}
                                className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors" title="Approve">
                                <CheckIcon className="w-4 h-4" />
                              </button>
                            )}
                            {canReject(r.status) && (
                              <button onClick={() => handleStatusChange(r.request_id, 'Rejected')}
                                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors" title="Reject">
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {requests.length === 0 && <p className="text-center text-gray-400 py-8">No leave requests found.</p>}
          </div>
        </div>
      )}

      {/* Leave Balance */}
      {activeTab === 'balance' && (
        <div className="glass-card p-6">
          {isAdmin && (
            <div className="flex items-center gap-3 mb-6">
              <select value={selectedEmpId} onChange={e => { setSelectedEmpId(e.target.value); fetchBalance(e.target.value); }}
                className="input-field w-64">
                <option value="">Select Employee</option>
                {employees.map(e => <option key={e.employee_id} value={e.employee_id}>{e.name}</option>)}
              </select>
            </div>
          )}
          {balance.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {balance.map((b, i) => {
                const remaining = b.total_days - Number(b.used_days);
                const pct = Math.min(100, Math.round((Number(b.used_days) / b.total_days) * 100));
                return (
                  <div key={b.leave_type_id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    <span className={`badge ${leaveColors[i % leaveColors.length]} mb-3 block w-fit`}>{b.leave_type}</span>
                    <p className="text-3xl font-black text-gray-800 dark:text-white">{remaining}<span className="text-base font-normal text-gray-400 dark:text-slate-500">/{b.total_days}</span></p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">days remaining</p>
                    <div className="mt-3 bg-gray-100 dark:bg-slate-800 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{b.used_days} days used</p>
                  </div>
                );
              })}
            </div>
          )}
          {balance.length === 0 && selectedEmpId && <p className="text-gray-400 text-center py-6">No balance data found.</p>}
          {isAdmin && !selectedEmpId && <p className="text-gray-400 text-center py-6">Select an employee to view their leave balance.</p>}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box animate-fade-in-up">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-5">Request Leave</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                  <select className="input-field" required value={form.employee_id}
                    onChange={e => setForm({ ...form, employee_id: e.target.value })}>
                    <option value="">Select Employee</option>
                    {employees.map(e => <option key={e.employee_id} value={e.employee_id}>{e.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select className="input-field" required value={form.leave_type_id}
                  onChange={e => setForm({ ...form, leave_type_id: e.target.value })}>
                  <option value="">Select Type</option>
                  {leaveTypes.map(t => <option key={t.leave_type_id} value={t.leave_type_id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" className="input-field" required value={form.start_date}
                    onChange={e => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" className="input-field" required value={form.end_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea className="input-field resize-none" rows={3} placeholder="Reason for leave..."
                  value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Submit Request</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
