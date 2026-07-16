'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building,
  FileText,
  MessageSquare,
  Users,
  Search,
  Plus,
  Power,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  MapPin,
  Mail,
  UserCheck,
  TrendingUp,
  AlertOctagon,
  UserPlus,
  Edit2,
  Trash2,
  Lock,
  Eye,
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'properties' | 'users' | 'agreements' | 'support'>('properties');
  const [properties, setProperties] = useState<any[]>([]);
  const [globalUsers, setGlobalUsers] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/Filters
  const [propSearch, setPropSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [supportFilter, setSupportFilter] = useState('ALL'); // ALL, PENDING, RESOLVED

  // Onboard PG Modal state
  const [showAddProp, setShowAddProp] = useState(false);
  const [newPropName, setNewPropName] = useState('');
  const [newPropSlug, setNewPropSlug] = useState('');
  const [newPropAddress, setNewPropAddress] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPass, setNewOwnerPass] = useState('');
  const [submittingProp, setSubmittingProp] = useState(false);

  // Global User Modal state
  const [showUserModal, setShowUserModal] = useState<any>(null); // 'CREATE' or user object
  const [gUserName, setGUserName] = useState('');
  const [gUserEmail, setGUserEmail] = useState('');
  const [gUserPassword, setGUserPassword] = useState('');
  const [gUserRole, setGUserRole] = useState('OWNER');
  const [gUserProperty, setGUserProperty] = useState('');
  const [gUserActive, setGUserActive] = useState(true);
  const [gUserSalary, setGUserSalary] = useState('');
  const [savingGUser, setSavingGUser] = useState(false);

  // Generate Lease Modal state
  const [selectedAgreement, setSelectedAgreement] = useState<any>(null);
  const [pdfUrlInput, setPdfUrlInput] = useState('');
  const [updatingLease, setUpdatingLease] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Properties
      const resProp = await fetch('/api/super-admin/properties');
      const propData = await resProp.json();
      if (!propData.error) setProperties(propData);

      // 2. Fetch Global Users
      const resUsers = await fetch('/api/super-admin/users');
      const usersData = await resUsers.json();
      if (!usersData.error) setGlobalUsers(usersData);

      // 3. Fetch Agreements
      const resAgr = await fetch('/api/super-admin/agreements');
      const agrData = await resAgr.json();
      if (!agrData.error) setAgreements(agrData);

      // 4. Fetch Support Queries
      const resQueries = await fetch('/api/super-admin/queries');
      const queriesData = await resQueries.json();
      if (!queriesData.error) setQueries(queriesData);
    } catch (e) {
      console.error('Super Admin fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleOnboardProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName || !newPropSlug || !newPropAddress || !newOwnerName || !newOwnerEmail || !newOwnerPass) {
      return alert('All fields are required');
    }
    setSubmittingProp(true);

    try {
      const res = await fetch('/api/super-admin/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPropName,
          slug: newPropSlug.toLowerCase().replace(/\s+/g, '-'),
          address: newPropAddress,
          ownerName: newOwnerName,
          ownerEmail: newOwnerEmail,
          ownerPassword: newOwnerPass,
        }),
      });

      if (res.ok) {
        alert('PG Client onboarded successfully!');
        setShowAddProp(false);
        // Reset form
        setNewPropName('');
        setNewPropSlug('');
        setNewPropAddress('');
        setNewOwnerName('');
        setNewOwnerEmail('');
        setNewOwnerPass('');
        loadAllData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to onboard property');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingProp(false);
    }
  };

  const handleToggleStatus = async (propertyId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to change this subscription status to ${nextStatus}?`)) return;

    try {
      const res = await fetch('/api/super-admin/properties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, status: nextStatus }),
      });

      if (res.ok) {
        loadAllData();
      } else {
        alert('Failed to update status');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Super Admin Global Users CRUD handlers
  const handleGUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGUser(true);

    try {
      const isEdit = showUserModal && showUserModal !== 'CREATE';
      const url = '/api/super-admin/users';
      const method = isEdit ? 'PUT' : 'POST';

      const payload: any = {
        name: gUserName,
        role: gUserRole,
        propertyId: gUserProperty || null,
        salaryAmount: gUserSalary || null,
      };

      if (isEdit) {
        payload.targetUserId = showUserModal.id;
        payload.isActive = gUserActive;
        if (gUserPassword) payload.password = gUserPassword;
      } else {
        payload.email = gUserEmail;
        payload.password = gUserPassword || 'password123';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(isEdit ? 'User updated successfully!' : 'User created successfully!');
        setShowUserModal(null);
        // reset states
        setGUserName('');
        setGUserEmail('');
        setGUserPassword('');
        setGUserRole('OWNER');
        setGUserProperty('');
        setGUserSalary('');
        loadAllData();
      } else {
        const err = await res.json();
        alert(err.error || 'Operation failed');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingGUser(false);
    }
  };

  const handleDeleteGUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user account?')) return;

    try {
      const res = await fetch(`/api/super-admin/users?userId=${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadAllData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete user');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfUrlInput) return alert('PDF URL is required');
    setUpdatingLease(true);

    try {
      const res = await fetch('/api/super-admin/agreements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementId: selectedAgreement.id,
          generatedPdfUrl: pdfUrlInput,
          status: 'GENERATED',
        }),
      });

      if (res.ok) {
        alert('Lease generated and linked to tenant profile!');
        setSelectedAgreement(null);
        setPdfUrlInput('');
        loadAllData();
      } else {
        alert('Failed to upload lease');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingLease(false);
    }
  };

  const handleResolveQuery = async (queryId: string) => {
    if (!confirm('Mark this bug/query ticket as RESOLVED?')) return;

    try {
      const res = await fetch('/api/super-admin/queries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId, status: 'RESOLVED' }),
      });

      if (res.ok) {
        loadAllData();
      } else {
        alert('Failed to resolve query');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-500">Syncing SaaS Global Desk...</p>
      </div>
    );
  }

  // Filter lists
  const filteredProps = properties.filter((p) => p.name.toLowerCase().includes(propSearch.toLowerCase()));
  const filteredUsers = globalUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredQueries = queries.filter((q) => supportFilter === 'ALL' || q.status === supportFilter);

  return (
    <div className="space-y-6 text-xs font-semibold text-slate-800">
      
      {/* Global SaaS Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            MagicTick SaaS Operator
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-2">MagicTick SaaS Console</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Configure white-labeled PGs, manage software licenses, draft agreements, and handle tech support.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddProp(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard New PG</span>
          </button>
          <button
            onClick={loadAllData}
            className="flex items-center justify-center bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 p-2 rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SaaS Global Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active PGs</span>
            <h3 className="text-2xl font-extrabold text-slate-950">
              {properties.filter((p) => p.status === 'ACTIVE').length}{' '}
              <span className="text-xs font-semibold text-slate-400">/ {properties.length}</span>
            </h3>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lease Tasks</span>
            <h3 className="text-2xl font-extrabold text-slate-950">
              {agreements.filter((a) => a.superAdminStatus === 'PENDING').length}{' '}
              <span className="text-xs font-semibold text-slate-400">pending</span>
            </h3>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tech Bug Tickets</span>
            <h3 className="text-2xl font-extrabold text-rose-600">
              {queries.filter((q) => q.status === 'PENDING').length}{' '}
              <span className="text-xs font-semibold text-slate-400">active</span>
            </h3>
          </div>
          <div className="bg-rose-50 text-rose-600 p-3 rounded-xl">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total SaaS Users</span>
            <h3 className="text-2xl font-extrabold text-emerald-600">
              {globalUsers.length}
            </h3>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab('properties')}
            className={`flex items-center gap-1.5 px-6 py-3 font-bold text-xs border-r border-slate-200 transition-all ${
              activeTab === 'properties' ? 'bg-white text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            PG Properties
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-6 py-3 font-bold text-xs border-r border-slate-200 transition-all ${
              activeTab === 'users' ? 'bg-white text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Global User Directory
          </button>
          <button
            onClick={() => setActiveTab('agreements')}
            className={`flex items-center gap-1.5 px-6 py-3 font-bold text-xs border-r border-slate-200 transition-all ${
              activeTab === 'agreements' ? 'bg-white text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Lease Applications
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-1.5 px-6 py-3 font-bold text-xs transition-all ${
              activeTab === 'support' ? 'bg-white text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Support Helpdesk
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: PROPERTIES */}
          {activeTab === 'properties' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={propSearch}
                    onChange={(e) => setPropSearch(e.target.value)}
                    placeholder="Search by PG name..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                      <th className="p-3.5">PG Property Details</th>
                      <th className="p-3.5">Slug/Subdomain</th>
                      <th className="p-3.5">Owner Client</th>
                      <th className="p-3.5">Occupancy Rate</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProps.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-500">
                          No PG clients onboarded yet.
                        </td>
                      </tr>
                    ) : (
                      filteredProps.map((p) => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="p-3.5">
                            <div>
                              <h4 className="font-extrabold text-slate-900">{p.name}</h4>
                              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {p.address}
                              </p>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono bg-slate-50 border border-slate-150 px-2 py-0.5 rounded text-[10px]">
                              {p.slug}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div>
                              <h4 className="font-bold text-slate-700">{p.ownerName}</h4>
                              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5 mt-0.5">
                                <Mail className="w-3 h-3" />
                                {p.ownerEmail}
                              </p>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-950">{p.occupancyRate}%</span>
                              <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full"
                                  style={{ width: `${p.occupancyRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                                p.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <button
                              onClick={() => handleToggleStatus(p.id, p.status)}
                              className={`flex items-center gap-1 font-bold px-3 py-1.5 rounded-lg border ${
                                p.status === 'ACTIVE'
                                  ? 'border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-50'
                                  : 'border-emerald-200 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                              <span>{p.status === 'ACTIVE' ? 'Pause' : 'Activate'}</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: GLOBAL USER DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users by name/email..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800"
                  />
                </div>

                <button
                  onClick={() => {
                    setGUserName('');
                    setGUserEmail('');
                    setGUserPassword('');
                    setGUserRole('OWNER');
                    setGUserProperty('');
                    setGUserActive(true);
                    setGUserSalary('');
                    setShowUserModal('CREATE');
                  }}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create System User</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                      <th className="p-3">User Details</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Assigned PG Property</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Salary Info</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-500">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="p-3">
                            <div>
                              <h4 className="font-extrabold text-slate-900">{u.name}</h4>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{u.email}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-700">{u.property?.name || 'SaaS Global Scope'}</span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                u.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}
                            >
                              {u.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="p-3">
                            {u.salaryAmount ? (
                              <div>
                                <span className="font-bold text-slate-800">₹{u.salaryAmount}</span>
                                <span className="text-[9px] font-extrabold text-slate-400 ml-1.5 uppercase">
                                  ({u.salaryPaidStatus})
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium">N/A</span>
                            )}
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setGUserName(u.name);
                                setGUserEmail(u.email);
                                setGUserPassword('');
                                setGUserRole(u.role);
                                setGUserProperty(u.propertyId || '');
                                setGUserActive(u.isActive);
                                setGUserSalary(u.salaryAmount || '');
                                setShowUserModal(u);
                              }}
                              className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteGUser(u.id)}
                              className="text-rose-600 hover:text-rose-800 inline-flex items-center gap-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AGREEMENTS */}
          {activeTab === 'agreements' && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-950 font-sans">Lease Applications Inbox</h3>
              
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                      <th className="p-3.5">Tenant Details</th>
                      <th className="p-3.5">Property Scope</th>
                      <th className="p-3.5">Agreement Plan</th>
                      <th className="p-3.5">Payment State</th>
                      <th className="p-3.5">Draft Status</th>
                      <th className="p-3.5">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agreements.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-500">
                          No rent agreement requests submitted.
                        </td>
                      </tr>
                    ) : (
                      agreements.map((a) => (
                        <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="p-3.5">
                            <div>
                              <h4 className="font-extrabold text-slate-900">{a.customer?.name || 'N/A'}</h4>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{a.customer?.phone}</p>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div>
                              <h4 className="font-bold text-slate-700">{a.propertyDetails}</h4>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{a.propertyAddress}</p>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px]">
                              {a.planType || 'STANDARD'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                a.applicationPaid
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}
                            >
                              {a.applicationPaid ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                                a.superAdminStatus === 'GENERATED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}
                            >
                              {a.superAdminStatus}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {a.superAdminStatus !== 'GENERATED' ? (
                              <button
                                onClick={() => setSelectedAgreement(a)}
                                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px]"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Generate Lease</span>
                              </button>
                            ) : (
                              <a
                                href={a.generatedPdfUrl}
                                target="_blank"
                                className="flex items-center gap-1.5 text-blue-600 hover:underline font-bold"
                              >
                                <span>View PDF</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SUPPORT */}
          {activeTab === 'support' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-slate-950 font-sans">MagicTick Helpdesk Bug Tickets</h3>
                
                <select
                  value={supportFilter}
                  onChange={(e) => setSupportFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700"
                >
                  <option value="ALL">Show All Tickets</option>
                  <option value="PENDING">Pending Only</option>
                  <option value="RESOLVED">Resolved Only</option>
                </select>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                      <th className="p-3.5">Submitted By</th>
                      <th className="p-3.5">Property Name</th>
                      <th className="p-3.5">Ticket Info</th>
                      <th className="p-3.5">Details</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQueries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-500">
                          No bug/queries tickets found.
                        </td>
                      </tr>
                    ) : (
                      filteredQueries.map((q) => (
                        <tr key={q.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="p-3.5">
                            <div>
                              <h4 className="font-extrabold text-slate-900">{q.customer?.name || 'Unknown'}</h4>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{q.customer?.phone || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-700">{q.property.name}</span>
                          </td>
                          <td className="p-3.5">
                            <div>
                              <span className="text-[9px] font-extrabold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {q.type}
                              </span>
                              <h4 className="font-bold text-slate-800 mt-1.5">{q.subject}</h4>
                            </div>
                          </td>
                          <td className="p-3.5 max-w-xs">
                            <p className="text-slate-500 font-medium leading-relaxed truncate hover:text-clip hover:whitespace-normal">
                              {q.message}
                            </p>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                                q.status === 'RESOLVED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}
                            >
                              {q.status}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {q.status === 'PENDING' && (
                              <button
                                onClick={() => handleResolveQuery(q.id)}
                                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px]"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Resolve</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Onboard PG client modal */}
      {showAddProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="bg-white border border-slate-200 max-w-md w-full p-6 rounded-2xl shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Onboard New White-labeled PG Client</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Creates an isolated property scope and an Owner login account.
              </p>
            </div>

            <form onSubmit={handleOnboardProperty} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">PG Property Name</label>
                  <input
                    type="text"
                    required
                    value={newPropName}
                    onChange={(e) => setNewPropName(e.target.value)}
                    placeholder="e.g. Nexus Premium Living"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Property Slug / URL ID</label>
                  <input
                    type="text"
                    required
                    value={newPropSlug}
                    onChange={(e) => setNewPropSlug(e.target.value)}
                    placeholder="e.g. nexus-hsr"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">PG Address</label>
                <input
                  type="text"
                  required
                  value={newPropAddress}
                  onChange={(e) => setNewPropAddress(e.target.value)}
                  placeholder="e.g. Sector 5, HSR Layout, Bengaluru"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>

              <div className="border-t pt-3 space-y-3">
                <h4 className="font-extrabold text-xs text-slate-800">Owner User Configuration</h4>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Owner Full Name</label>
                  <input
                    type="text"
                    required
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Owner Email ID</label>
                    <input
                      type="email"
                      required
                      value={newOwnerEmail}
                      onChange={(e) => setNewOwnerEmail(e.target.value)}
                      placeholder="owner@nexus.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Owner Password</label>
                    <input
                      type="password"
                      required
                      value={newOwnerPass}
                      onChange={(e) => setNewOwnerPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddProp(false)}
                  className="border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProp}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-xs"
                >
                  {submittingProp ? 'Onboarding...' : 'Onboard Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Global User Create/Edit Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="bg-white border border-slate-200 max-w-sm w-full p-6 rounded-2xl shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {showUserModal === 'CREATE' ? 'Create Global Account' : 'Modify User Account'}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {showUserModal === 'CREATE'
                  ? 'Provision credentials for any role or property scope.'
                  : `Editing login account settings.`}
              </p>
            </div>

            <form onSubmit={handleGUserSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Operator Name</label>
                <input
                  type="text"
                  required
                  value={gUserName}
                  onChange={(e) => setGUserName(e.target.value)}
                  placeholder="e.g. Anil Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>

              {showUserModal === 'CREATE' && (
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    value={gUserEmail}
                    onChange={(e) => setGUserEmail(e.target.value)}
                    placeholder="name@nexus.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">System Role</label>
                  <select
                    value={gUserRole}
                    onChange={(e) => setGUserRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="OWNER">OWNER</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="TENANT">TENANT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Assigned PG Property</label>
                  <select
                    value={gUserProperty}
                    onChange={(e) => setGUserProperty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  >
                    <option value="">None (Global / Admin)</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={gUserSalary}
                    onChange={(e) => setGUserSalary(e.target.value)}
                    placeholder="Optional salary"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>

                {showUserModal !== 'CREATE' && (
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      checked={gUserActive}
                      onChange={(e) => setGUserActive(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <label className="text-[9px] font-bold text-slate-650 uppercase">Active</label>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">
                  {showUserModal === 'CREATE' ? 'Password' : 'Password (Leave blank to keep)'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={gUserPassword}
                    onChange={(e) => setGUserPassword(e.target.value)}
                    placeholder={showUserModal === 'CREATE' ? 'password123' : 'Reset secure password'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(null)}
                  className="border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGUser}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-xs"
                >
                  {savingGUser ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate lease PDF modal */}
      {selectedAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="bg-white border border-slate-200 max-w-sm w-full p-6 rounded-2xl shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Upload Generated Lease Document</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Draft for tenant **{selectedAgreement.customer?.name || 'N/A'}** ({selectedAgreement.planType || 'STANDARD'} Plan).
              </p>
            </div>

            <form onSubmit={handleGenerateLease} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Generated PDF document URL</label>
                <input
                  type="url"
                  required
                  value={pdfUrlInput}
                  onChange={(e) => setPdfUrlInput(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAgreement(null)}
                  className="border border-slate-200 text-slate-600 font-bold px-4 py-1.5 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingLease}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs"
                >
                  {updatingLease ? 'Linking PDF...' : 'Deploy Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
