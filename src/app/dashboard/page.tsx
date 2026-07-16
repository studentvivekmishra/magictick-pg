'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Home,
  AlertOctagon,
  CreditCard,
  TrendingUp,
  DollarSign,
  UserPlus,
  RefreshCw,
  Edit2,
  Trash2,
  Lock,
  UserMinus,
  CheckCircle,
  KeyRound,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST';
}

export default function DashboardPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'metrics' | 'users'>('metrics');

  // User CRUD states
  const [showUserModal, setShowUserModal] = useState<any>(null); // 'CREATE' or user object for EDIT
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('MANAGER');
  const [userPassword, setUserPassword] = useState('');
  const [userActive, setUserActive] = useState(true);
  const [userSalary, setUserSalary] = useState('');
  const [userSalaryPaid, setUserSalaryPaid] = useState('PENDING');
  const [savingUser, setSavingUser] = useState(false);

  const loadDashboardData = async () => {
    try {
      // 1. Fetch Auth Session
      const resSession = await fetch('/api/auth');
      const sessionData = await resSession.json();
      if (sessionData.authenticated) {
        setSession(sessionData.user);
      }

      // 2. Fetch Business Metrics
      const resMetrics = await fetch('/api/dashboard/metrics');
      const metricsData = await resMetrics.json();
      setMetrics(metricsData);

      // 3. Fetch Users List (Owner/Manager permission checked in API)
      if (sessionData.user.role === 'OWNER' || sessionData.user.role === 'MANAGER') {
        const resUsers = await fetch('/api/users');
        const usersData = await resUsers.json();
        setUsersList(usersData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUser(true);

    try {
      const isEdit = showUserModal && showUserModal !== 'CREATE';
      const url = '/api/users';
      const method = isEdit ? 'PUT' : 'POST';
      
      const payload: any = {
        name: userName,
        role: userRole,
        salaryAmount: userSalary || null,
        salaryPaidStatus: userSalaryPaid,
      };

      if (isEdit) {
        payload.targetUserId = showUserModal.id;
        payload.isActive = userActive;
        if (userPassword) payload.password = userPassword; // Optional password reset
      } else {
        payload.email = userEmail;
        payload.password = userPassword || 'password123'; // Temporary password
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(isEdit ? 'User updated successfully' : 'User created with temporary password!');
        setShowUserModal(null);
        setUserName('');
        setUserEmail('');
        setUserPassword('');
        setUserSalary('');
        setUserSalaryPaid('PENDING');
        loadDashboardData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to process user');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`/api/users?userId=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('User account deleted');
        loadDashboardData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete user');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !metrics || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-500">Syncing business parameters...</p>
      </div>
    );
  }

  const { roomsSummary, financials, recentActivity, charts } = metrics;

  return (
    <div className="space-y-6 text-xs font-semibold text-slate-800">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Operations Control Desk</h2>
          <p className="text-slate-500 font-medium mt-1">
            Real-time bed allocations, invoice queues, staff management, and yield statistics.
          </p>
        </div>

        {(session.role === 'OWNER' || session.role === 'MANAGER') && (
          <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-4 py-2 font-bold transition-all ${
                activeTab === 'metrics' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              Business KPIs
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-bold transition-all ${
                activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              User Management
            </button>
          </div>
        )}
      </div>

      {activeTab === 'metrics' ? (
        <>
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Occupied Beds</span>
                <h3 className="text-2xl font-extrabold text-slate-950">
                  {roomsSummary.occupiedBeds} <span className="text-xs font-semibold text-slate-400">/ {roomsSummary.totalBeds}</span>
                </h3>
                <p className="text-[10px] text-slate-500">{roomsSummary.vacantBeds} vacant beds remaining</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Collected (July)</span>
                <h3 className="text-2xl font-extrabold text-emerald-600">
                  ₹{financials.monthlyRevenue}
                </h3>
                <p className="text-[10px] text-slate-500">From verified receipts</p>
              </div>
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Dues</span>
                <h3 className="text-2xl font-extrabold text-rose-600">
                  ₹{financials.pendingCollection}
                </h3>
                <p className="text-[10px] text-slate-500">Awaiting guest uploads</p>
              </div>
              <div className="bg-rose-50 text-rose-600 p-3 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Under Maintenance</span>
                <h3 className="text-2xl font-extrabold text-amber-600">
                  {roomsSummary.maintenanceRooms} <span className="text-xs font-semibold text-slate-400">rooms</span>
                </h3>
                <p className="text-[10px] text-slate-500">Flagged for housekeeping</p>
              </div>
              <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
                <AlertOctagon className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Occupancy Expansion Trend
              </h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.occupancyTrend}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Area type="monotone" dataKey="rate" stroke="#2563eb" fill="#2563eb" fillOpacity={0.08} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Home className="w-4 h-4 text-emerald-600" />
                Room Types Distribution
              </h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.roomDistribution}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="type" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Recent Operational Activity Logs</h3>
            <div className="space-y-2">
              {recentActivity.map((log: any) => (
                <div key={log.id} className="flex justify-between items-center py-2.5 px-3 border border-slate-100 hover:bg-slate-50 rounded-xl">
                  <div>
                    <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider mr-2">
                      {log.action}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">{log.details}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* User management view (Owner Only) */
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">User Account Directories</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Control staff login privileges and password resets.</p>
            </div>
            {session.role === 'OWNER' && (
              <button
                onClick={() => {
                  setUserName('');
                  setUserEmail('');
                  setUserRole('RECEPTIONIST');
                  setUserActive(true);
                  setShowUserModal('CREATE');
                }}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create User</span>
              </button>
            )}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Salary</th>
                  <th className="p-3">Salary Status</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Password Change</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800">{u.name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">
                      <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">₹{u.salaryAmount || 0}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          u.salaryPaidStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-amber-50 text-amber-750 border border-amber-100'
                        }`}
                      >
                        {u.salaryPaidStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">
                      {u.forcePasswordChange ? 'Yes (Pending reset)' : 'No (Cleared)'}
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      {session.role === 'OWNER' && (
                        <>
                          <button
                            onClick={() => {
                              setUserName(u.name);
                              setUserEmail(u.email);
                              setUserRole(u.role);
                              setUserActive(u.isActive);
                              setUserSalary(u.salaryAmount || '');
                              setUserSalaryPaid(u.salaryPaidStatus || 'PENDING');
                              setShowUserModal(u);
                            }}
                            className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          {u.id !== session.userId && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-rose-600 hover:text-rose-800 inline-flex items-center gap-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User CRUD Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white border border-slate-200 max-w-sm w-full p-6 rounded-2xl shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 font-sans">
                {showUserModal === 'CREATE' ? 'Add User Account' : 'Modify User Account'}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {showUserModal === 'CREATE'
                  ? 'Assign roles and set up credentials for PG operators.'
                  : `Editing configurations for ${userEmail}`}
              </p>
            </div>

            <form onSubmit={handleUserSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Operator Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  required
                />
              </div>

              {showUserModal === 'CREATE' && (
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Operational Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                >
                  <option value="MANAGER">Manager Admin</option>
                  <option value="OWNER">Owner Master</option>
                </select>
              </div>

              {showUserModal !== 'CREATE' && (
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={userActive}
                    onChange={(e) => setUserActive(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Account Active Status</label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={userSalary}
                    onChange={(e) => setUserSalary(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Salary Status</label>
                  <select
                    value={userSalaryPaid}
                    onChange={(e) => setUserSalaryPaid(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">
                  {showUserModal === 'CREATE' ? 'Temporary Password' : 'Reset Password (Leave blank to keep)'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder={showUserModal === 'CREATE' ? 'password123' : 'New secure password'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(null)}
                  className="border border-slate-200 text-slate-600 font-bold px-4 py-1.5 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs"
                >
                  {savingUser ? 'Processing...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
