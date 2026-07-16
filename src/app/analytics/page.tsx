'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  Percent,
  RefreshCw,
  Home,
  Users,
  DollarSign,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

interface UserSession {
  userId: string;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST';
}

export default function AnalyticsPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const resSession = await fetch('/api/auth');
      const sessionData = await resSession.json();
      if (sessionData.authenticated) {
        setSession(sessionData.user);
      }

      const resMetrics = await fetch('/api/dashboard/metrics');
      const metricsData = await resMetrics.json();
      setData(metricsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !data || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <TrendingUp className="w-8 h-8 animate-bounce text-indigo-500" />
        <p className="text-sm font-semibold text-muted-foreground">Gathering business intelligence metrics...</p>
      </div>
    );
  }

  const { roomsSummary, financials, charts } = data;

  // Additional mock indicators for SaaS yield dashboards
  const retentionRate = 92;
  const avgStayDuration = 8.5; // months
  const yieldUtilization = 94; // occupancy/pricing optimization index

  // Floor wise income dataset
  const floorInflowData = [
    { floor: 'Floor 1', income: 14000 },
    { floor: 'Floor 2', income: 11000 },
    { floor: 'Floor 3', income: 8800 },
  ];

  // Collection trend dataset
  const collectionTrendData = [
    { cycle: 'Feb', collected: 12000, pending: 1500 },
    { cycle: 'Mar', collected: 16000, pending: 800 },
    { cycle: 'Apr', collected: 21000, pending: 1200 },
    { cycle: 'May', collected: 24000, pending: 500 },
    { cycle: 'Jun', collected: 29800, pending: 0 },
    { cycle: 'Jul', collected: financials.monthlyRevenue || 33800, pending: financials.pendingCollection || 5800 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Business Intelligence & Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Yield optimizations, tenant retention rates, room floor performance, and revenue trends.
          </p>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-indigo-500" />
            Tenant Retention
          </span>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-foreground">{retentionRate}%</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Average month-on-month</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            Avg Guest Stay
          </span>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-foreground">{avgStayDuration} months</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Time duration per tenant</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Yield Optimization
          </span>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-foreground">{yieldUtilization}%</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Room utilization efficiency</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-pink-500" />
            Security Deposits
          </span>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-foreground">₹{financials.depositsCollected}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Active escrow reserves</p>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid md:grid-cols-12 gap-6">
        
        {/* Collection Paid vs Overdue Trend Chart */}
        <div className="md:col-span-8 bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
            Collection Trend: Paid vs Pending Invoices
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={collectionTrendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="cycle" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(value) => `₹${value}`} contentStyle={{ borderRadius: 12 }} />
                <Area type="monotone" dataKey="collected" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                <Area type="monotone" dataKey="pending" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Floor Wise Income Bar Chart */}
        <div className="md:col-span-4 bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider mb-4">
            Floor wise Revenue Yield
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={floorInflowData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="floor" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Bar dataKey="income" fill="#a855f7" radius={[8, 8, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <span className="text-[10px] text-muted-foreground block text-center font-bold">
            First floor yields higher returns due to single sharing layouts.
          </span>
        </div>

      </div>

      <div className="grid md:grid-cols-12 gap-6">
        
        {/* Occupancy Trend Area Chart */}
        <div className="md:col-span-12 bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
            Six-Month Occupancy Rate Expansion
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.occupancyTrend}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Area type="monotone" dataKey="rate" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
