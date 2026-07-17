'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  X,
  Clock,
  User,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';

interface Visitor {
  id: string;
  visitorName: string;
  phone: string;
  relation: string;
  entryTime: string;
  exitTime: string | null;
  photoUrl: string | null;
  customer: {
    name: string;
  };
}

interface TenantOption {
  id: string;
  name: string;
}

interface UserSession {
  userId: string;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST';
}

export default function VisitorsPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form fields
  const [visitorName, setVisitorName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      const resSession = await fetch('/api/auth');
      const sessionData = await resSession.json();
      if (sessionData.authenticated) {
        setSession(sessionData.user);
      }

      // Fetch visitors
      const resVisitors = await fetch('/api/visitors');
      const visitorsData = await resVisitors.json();
      setVisitors(visitorsData);

      // Fetch active tenants
      const resCustomers = await fetch('/api/customers?status=ACTIVE');
      const customersData = await resCustomers.json();
      setTenantOptions(customersData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    if (!visitorName || !phone || !relation || !customerId) {
      alert('Please fill in all fields');
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorName,
          phone,
          relation,
          customerId,
          photoUrl: photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=80',
        }),
      });

      if (res.ok) {
        setIsAddOpen(false);
        setVisitorName('');
        setPhone('');
        setRelation('');
        setCustomerId('');
        setPhotoUrl('');
        loadData();
      } else {
        alert('Failed to register visitor');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckoutVisitor = async (visitorId: string) => {
    try {
      const res = await fetch('/api/visitors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      });
      if (res.ok) {
        loadData();
      } else {
        alert('Failed to checkout visitor');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredVisitors = visitors.filter((v) => {
    const matchesSearch =
      v.visitorName.toLowerCase().includes(search.toLowerCase()) ||
      v.customer.name.toLowerCase().includes(search.toLowerCase());
    const matchesActive = !filterActiveOnly || !v.exitTime;
    return matchesSearch && matchesActive;
  });

  if (loading || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <UserCheck className="w-8 h-8 animate-bounce text-indigo-500" />
        <p className="text-sm font-semibold text-muted-foreground">Loading visitor roster logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Visitor Log Registry</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Register guest visitors, track entry time records, and log checkout exit times.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Register Visitor Entry
        </button>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search visitor name or tenant visiting..."
            className="w-full bg-background border border-border rounded-xl py-2 pl-9 pr-4 text-xs text-foreground focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-2">
          <input
            type="checkbox"
            id="activeFilter"
            checked={filterActiveOnly}
            onChange={(e) => setFilterActiveOnly(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-border rounded focus:ring-0 focus:ring-offset-0"
          />
          <label htmlFor="activeFilter" className="text-muted-foreground cursor-pointer select-none">
            Show active visitors only (currently inside PG premises)
          </label>
        </div>
      </div>

      {/* Visitors Log Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto responsive-table">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-bold font-sans">
                <th className="p-4">Visitor</th>
                <th className="p-4">Visiting Guest</th>
                <th className="p-4">Relationship</th>
                <th className="p-4">Entry Time</th>
                <th className="p-4">Exit Time</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted-foreground font-semibold">
                    No visitor logs found.
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((v) => (
                  <tr key={v.id} className="border-b border-border hover:bg-muted/10 transition-colors font-semibold">
                    <td className="p-4" data-label="Visitor">
                      <div className="flex items-center gap-3 justify-end md:justify-start">
                        <div className="w-8 h-8 rounded-full overflow-hidden border bg-zinc-200 shrink-0">
                          <img
                            src={v.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=80'}
                            alt={v.visitorName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm text-foreground">{v.visitorName}</p>
                          <span className="text-[10px] text-muted-foreground">{v.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-foreground" data-label="Visiting Guest">{v.customer.name}</td>
                    <td className="p-4" data-label="Relationship">{v.relation}</td>
                    <td className="p-4" data-label="Entry Time">
                      <span className="flex items-center gap-1 justify-end md:justify-start">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        {new Date(v.entryTime).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground" data-label="Exit Time">
                      {v.exitTime ? (
                        <span className="flex items-center gap-1 justify-end md:justify-start">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          {new Date(v.exitTime).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                          Inside PG
                        </span>
                      )}
                    </td>
                    <td className="p-4" data-label="Action">
                      {!v.exitTime ? (
                        <button
                          type="button"
                          onClick={() => handleCheckoutVisitor(v.id)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] shadow-sm active:scale-95 transition-all w-full sm:w-auto"
                        >
                          Check Out Visitor
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-bold">Logged out</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register Visitor */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-slide-up">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-extrabold">Register Visitor Entry</h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterVisitor} className="p-6 space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Select Tenant to Visit</label>
                <select
                  value={customerId}
                  required
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground font-semibold"
                >
                  <option value="">-- Select Active Tenant --</option>
                  {tenantOptions.map((to) => (
                    <option key={to.id} value={to.id}>
                      {to.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Visitor Full Name *</label>
                  <input
                    type="text"
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="e.g. Amit Sharma"
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Relation *</label>
                  <input
                    type="text"
                    required
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    placeholder="e.g. Parent / Friend"
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Visitor Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Photo URL (Mock Image)</label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="py-2 px-4 rounded-xl border border-border text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Registering...' : 'Register Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
