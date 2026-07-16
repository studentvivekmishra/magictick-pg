'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  CheckCircle,
  Clock,
  Plus,
  Search,
  User,
  X,
  Sparkles,
  Info,
  Wrench,
  HelpCircle,
} from 'lucide-react';

interface Complaint {
  id: string;
  category: 'WATER' | 'ELECTRICITY' | 'CLEANING' | 'INTERNET' | 'FURNITURE' | 'OTHERS';
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolvedAt: string | null;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
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

export default function ComplaintsPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, IN_PROGRESS, RESOLVED, CLOSED
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form fields
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'WATER' | 'ELECTRICITY' | 'CLEANING' | 'INTERNET' | 'FURNITURE' | 'OTHERS'>('WATER');
  const [description, setDescription] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      const resSession = await fetch('/api/auth');
      const sessionData = await resSession.json();
      if (sessionData.authenticated) {
        setSession(sessionData.user);
      }

      // Fetch complaints
      const resComplaints = await fetch('/api/complaints');
      const complaintsData = await resComplaints.json();
      setComplaints(complaintsData);

      // Fetch active tenants for dropdown
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

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    if (!selectedCustomerId || !description) {
      alert('Please fill in all fields');
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          category: selectedCategory,
          description,
        }),
      });

      if (res.ok) {
        setIsAddOpen(false);
        setSelectedCustomerId('');
        setDescription('');
        loadData();
      } else {
        alert('Failed to raise ticket');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/complaints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaintId, status: newStatus }),
      });
      if (res.ok) {
        loadData();
      } else {
        alert('Status update failed');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch = c.customer.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <AlertOctagon className="w-8 h-8 animate-bounce text-indigo-500" />
        <p className="text-sm font-semibold text-muted-foreground">Loading complaints bureau...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Complaints & Tickets Desk</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track plumbing, electricity, cleaning, internet issues, and resolve tickets.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Raise Complaint
        </button>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant name..."
            className="w-full bg-background border border-border rounded-xl py-2 pl-9 pr-4 text-xs text-foreground focus:border-indigo-500 transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:border-indigo-500 transition-colors font-semibold"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending Tickets</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved Tickets</option>
          <option value="CLOSED">Closed Tickets</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:border-indigo-500 transition-colors font-semibold"
        >
          <option value="ALL">All Categories</option>
          <option value="WATER">Water / Plumbing</option>
          <option value="ELECTRICITY">Electricity / Power</option>
          <option value="CLEANING">Cleaning / Housekeeping</option>
          <option value="INTERNET">Internet / Wi-Fi</option>
          <option value="FURNITURE">Furniture</option>
          <option value="OTHERS">Others</option>
        </select>
      </div>

      {/* Tickets List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredComplaints.map((ticket) => {
          let statusBadge = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
          let statusIcon = AlertOctagon;
          if (ticket.status === 'IN_PROGRESS') {
            statusBadge = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            statusIcon = Clock;
          } else if (ticket.status === 'RESOLVED') {
            statusBadge = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            statusIcon = CheckCircle;
          } else if (ticket.status === 'CLOSED') {
            statusBadge = 'bg-zinc-500/10 text-muted-foreground border-zinc-500/20';
            statusIcon = CheckCircle;
          }

          const Icon = statusIcon;

          return (
            <div
              key={ticket.id}
              className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300 relative shadow-sm"
            >
              <div className="space-y-3.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground">{ticket.customer.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Raised on: {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-full uppercase tracking-wider ${statusBadge} flex items-center gap-1`}>
                    <Icon className="w-3 h-3" />
                    {ticket.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded uppercase w-max block">
                    {ticket.category}
                  </span>
                  <p className="text-xs text-foreground/80 leading-relaxed font-semibold">
                    "{ticket.description}"
                  </p>
                </div>
              </div>

              {/* Status Update selectors for staff/owners */}
              <div className="pt-4 border-t border-border/60 mt-4 flex justify-between items-center text-xs">
                <span className="text-[10px] text-muted-foreground font-bold">
                  {ticket.resolvedAt ? `Resolved: ${new Date(ticket.resolvedAt).toLocaleDateString()}` : 'Active ticket'}
                </span>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                  className="bg-card border border-border rounded-lg px-2 py-1 text-[10px] font-bold focus:ring-0 focus:outline-none cursor-pointer"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Raise Complaint */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-slide-up">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-extrabold">Raise Complaint Ticket</h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="p-6 space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Select Guest staying</label>
                <select
                  value={selectedCustomerId}
                  required
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
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

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Complaint Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e: any) => setSelectedCategory(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground font-semibold"
                >
                  <option value="WATER">Water / Plumbing</option>
                  <option value="ELECTRICITY">Electricity / Power</option>
                  <option value="CLEANING">Cleaning / Housekeeping</option>
                  <option value="INTERNET">Internet / Wi-Fi</option>
                  <option value="FURNITURE">Furniture</option>
                  <option value="OTHERS">Others</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Issue Details *</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={4}
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
                  {actionLoading ? 'Creating...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
