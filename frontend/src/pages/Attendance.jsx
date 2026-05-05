import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { CalendarIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const statusColors = {
  Present: 'badge-green',
  Absent: 'badge-red',
  Leave: 'badge-yellow'
};

const Attendance = () => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const employeeId = localStorage.getItem('employeeId');
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [markMode, setMarkMode] = useState({});
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState(isAdmin ? 'mark' : 'records');

  useEffect(() => {
    if (isAdmin) {
      fetchEmployees();
    }
    fetchAttendance();
    fetchSummary();
  }, [selectedMonth]);

  const fetchEmployees = async () => {
    const res = await api.get('/employees/');
    setEmployees(res.data);
    const defaults = {};
    res.data.forEach(e => { defaults[e.employee_id] = 'Present'; });
    setMarkMode(defaults);
  };

  const fetchAttendance = async () => {
    const params = { month: selectedMonth };
    if (!isAdmin) params.employee_id = employeeId;
    const res = await api.get('/attendance/', { params });
    setRecords(res.data);
  };

  const fetchSummary = async () => {
    const params = { month: selectedMonth };
    if (!isAdmin) params.employee_id = employeeId;
    const res = await api.get('/attendance/summary', { params });
    setSummary(res.data);
  };

  const handleBulkMark = async () => {
    const payload = {
      date: selectedDate,
      records: employees.map(e => ({ employee_id: e.employee_id, status: markMode[e.employee_id] || 'Present' }))
    };
    await api.post('/attendance/bulk', payload);
    setMessage('✅ Attendance saved successfully!');
    setTimeout(() => setMessage(''), 3000);
    fetchAttendance();
    fetchSummary();
  };

  const totalPresent = summary.reduce((s, r) => s + Number(r.present_days), 0);
  const totalAbsent = summary.reduce((s, r) => s + Number(r.absent_days), 0);
  const totalLeave = summary.reduce((s, r) => s + Number(r.leave_days), 0);

  const doughnutData = {
    labels: ['Present', 'Absent', 'Leave'],
    datasets: [{
      data: [totalPresent, totalAbsent, totalLeave],
      backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
      borderWidth: 0,
      hoverOffset: 6
    }]
  };

  const barData = {
    labels: summary.slice(0, 10).map(s => s.name.split(' ')[0]),
    datasets: [
      {
        label: 'Present',
        data: summary.slice(0, 10).map(s => s.present_days),
        backgroundColor: '#10b981',
        borderRadius: 4
      },
      {
        label: 'Absent',
        data: summary.slice(0, 10).map(s => s.absent_days),
        backgroundColor: '#ef4444',
        borderRadius: 4
      }
    ]
  };

  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDarkMode ? '#94a3b8' : '#64748b',
          font: { weight: 'bold', size: 11 }
        }
      }
    },
    scales: isDarkMode ? {
      y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
    } : {
      y: { grid: { borderDash: [5, 5] } }
    }
  };

  const availableTabs = isAdmin 
    ? [{ id: 'mark', label: '📋 Mark Attendance' }, { id: 'records', label: '📊 Records' }, { id: 'analytics', label: '📈 Analytics' }]
    : [{ id: 'records', label: '📊 My History' }, { id: 'analytics', label: '📈 My Analytics' }];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title gradient-text">{isAdmin ? 'Attendance Management' : 'My Attendance'}</h1>
          <p className="page-subtitle">{isAdmin ? 'Track and manage employee attendance records' : 'View your attendance and performance records'}</p>
        </div>
        <div className="flex gap-3 items-center">
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="input-field w-44" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: isAdmin ? 'Total Present' : 'Present Days', value: totalPresent, icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: isAdmin ? 'Total Absent' : 'Absent Days', value: totalAbsent, icon: XCircleIcon, color: 'text-red-500', bg: 'bg-red-100' },
          { label: isAdmin ? 'On Leave' : 'Leave Days', value: totalLeave, icon: ClockIcon, color: 'text-amber-500', bg: 'bg-amber-100' }
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`${s.bg} dark:bg-opacity-10 p-3 rounded-xl`}>
              <s.icon className={`w-7 h-7 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100/80 dark:bg-slate-900/50 p-1 rounded-xl w-fit border border-transparent dark:border-slate-800">
        {availableTabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm' 
                : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mark Attendance Tab */}
      {activeTab === 'mark' && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Mark Attendance for Date</h2>
            <div className="flex gap-3 items-center">
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="input-field w-44" />
              <button onClick={handleBulkMark} className="btn-primary">Save Attendance</button>
            </div>
          </div>
          {message && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
              {message}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Employee</th><th>Department</th><th>Status</th></tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.employee_id}>
                    <td><span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">#{String(emp.employee_id).padStart(3, '0')}</span></td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                          {emp.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-800 dark:text-white">{emp.name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-blue">{emp.department}</span></td>
                    <td>
                      <div className="flex gap-2">
                        {['Present', 'Absent', 'Leave'].map(s => (
                          <button key={s}
                            onClick={() => setMarkMode(prev => ({ ...prev, [emp.employee_id]: s }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              markMode[emp.employee_id] === s
                                ? s === 'Present' ? 'bg-emerald-500 text-white border-emerald-500'
                                  : s === 'Absent' ? 'bg-red-500 text-white border-red-500'
                                  : 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:border-indigo-300'
                            }`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Attendance Records</h2>
          <div className="mobile-table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Employee</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {records.slice(0, 50).map((r, i) => (
                  <tr key={r.attendance_id}>
                    <td className="text-xs font-bold text-indigo-600 dark:text-indigo-400">#{String(r.employee_id).padStart(3, '0')}</td>
                    <td className="font-medium text-gray-800 dark:text-white">{r.employee_name}</td>
                    <td className="text-gray-600 dark:text-slate-400">{r.date}</td>
                    <td><span className={`badge ${statusColors[r.status] || 'badge-gray'}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {records.length === 0 && <p className="text-center text-gray-400 py-8 italic font-medium">No records found for this period.</p>}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="chart-card">
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Attendance Distribution</h3>
            <div className="h-56">
              {totalPresent + totalAbsent + totalLeave > 0
                ? <Doughnut data={doughnutData} options={chartOptions} />
                : <p className="text-center text-gray-400 mt-16">No data for this period</p>
              }
            </div>
          </div>
          <div className="chart-card">
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Top 10 Employees Attendance</h3>
            <div className="h-56">
              {summary.length > 0
                ? <Bar data={barData} options={chartOptions} />
                : <p className="text-center text-gray-400 mt-16">No data for this period</p>
              }
            </div>
          </div>
          <div className="glass-card p-6 lg:col-span-2">
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Employee Summary</h3>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Employee</th><th>Department</th><th>Present</th><th>Absent</th><th>Leave</th><th>Attendance %</th></tr>
                </thead>
                <tbody>
                  {summary.map(s => {
                    const total = Number(s.present_days) + Number(s.absent_days) + Number(s.leave_days);
                    const pct = total > 0 ? Math.round((Number(s.present_days) / total) * 100) : 0;
                    return (
                      <tr key={s.employee_id}>
                        <td><span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">#{String(s.employee_id).padStart(3, '0')}</span></td>
                        <td className="font-medium text-gray-800 dark:text-white">{s.name}</td>
                        <td><span className="badge badge-blue">{s.department}</span></td>
                        <td><span className="font-semibold text-emerald-600">{s.present_days}</span></td>
                        <td><span className="font-semibold text-red-500">{s.absent_days}</span></td>
                        <td><span className="font-semibold text-amber-500">{s.leave_days}</span></td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className={'h-2 rounded-full ' + (pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400')}
                                   style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-bold text-gray-600 w-9">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
