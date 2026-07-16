'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Search,
  Plus,
  FileDown,
  Clock,
  X,
  Sparkles,
  Info,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import jsPDF from 'jspdf';

interface Expense {
  id: string;
  category: 'ELECTRICITY' | 'WATER' | 'MAINTENANCE' | 'SALARY' | 'INTERNET' | 'FOOD' | 'CLEANING' | 'OTHERS';
  amount: number;
  date: string;
  remarks: string | null;
  createdBy: {
    name: string;
  };
}

interface UserSession {
  userId: string;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST';
}

export default function ExpensesPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form fields
  const [category, setCategory] = useState<'ELECTRICITY' | 'WATER' | 'MAINTENANCE' | 'SALARY' | 'INTERNET' | 'FOOD' | 'CLEANING' | 'OTHERS'>('ELECTRICITY');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      const resSession = await fetch('/api/auth');
      const sessionData = await resSession.json();
      if (sessionData.authenticated) {
        setSession(sessionData.user);
      }

      // Fetch expenses
      const resExpenses = await fetch('/api/expenses');
      const expensesData = await resExpenses.json();
      setExpenses(expensesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    if (!amount || !date) {
      alert('Please fill in all required fields');
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          amount,
          date,
          remarks,
        }),
      });

      if (res.ok) {
        setIsAddOpen(false);
        setAmount('');
        setDate('');
        setRemarks('');
        loadData();
      } else {
        alert('Failed to log expense');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Export reports logic (CSV/Excel/PDF)
  const downloadCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Date,Category,Amount (INR),Remarks,Recorded By\n';
    
    expenses.forEach((e) => {
      csvContent += `${new Date(e.date).toLocaleDateString()},${e.category},${e.amount},"${e.remarks || ''}",${e.createdBy.name}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PG_ExpenseReport_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDFReport = () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('PG Nexus - Monthly Expense Audit Report', 14, 20);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);
      pdf.text(`Total Records: ${expenses.length}`, 14, 31);
      
      const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total Spent: INR ${totalAmount}`, 14, 36);

      // Simple Table layout
      let startY = 46;
      pdf.setFontSize(9);
      pdf.text('Date', 14, startY);
      pdf.text('Category', 40, startY);
      pdf.text('Amount (INR)', 80, startY);
      pdf.text('Remarks', 110, startY);
      pdf.text('By', 170, startY);
      pdf.line(14, startY + 2, 195, startY + 2);

      startY += 8;
      pdf.setFont('helvetica', 'normal');
      
      expenses.forEach((e) => {
        if (startY > 270) {
          pdf.addPage();
          startY = 20;
        }
        pdf.text(new Date(e.date).toLocaleDateString(), 14, startY);
        pdf.text(e.category, 40, startY);
        pdf.text(e.amount.toString(), 80, startY);
        pdf.text((e.remarks || '').slice(0, 30), 110, startY);
        pdf.text(e.createdBy.name.split(' ')[0], 170, startY);
        startY += 7;
      });

      pdf.save(`ExpenseReport_${Date.now()}.pdf`);
    } catch (e) {
      console.error(e);
      alert('PDF generation failed');
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch = (e.remarks || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate aggregates
  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const salarySpent = filteredExpenses.filter((e) => e.category === 'SALARY').reduce((sum, e) => sum + e.amount, 0);
  const electricitySpent = filteredExpenses.filter((e) => e.category === 'ELECTRICITY').reduce((sum, e) => sum + e.amount, 0);

  if (loading || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <DollarSign className="w-8 h-8 animate-bounce text-indigo-500" />
        <p className="text-sm font-semibold text-muted-foreground">Loading expense ledgers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Expense Tracker</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track utilities (water, electricity bills), housekeeping, internet subscriptions, staff salaries, and download audit reports.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 border border-border bg-card text-xs font-bold py-2 px-3.5 rounded-xl hover:bg-muted active:scale-95 transition-all"
          >
            <FileDown className="w-4 h-4 text-emerald-500" />
            CSV / Excel Report
          </button>
          <button
            onClick={downloadPDFReport}
            className="flex items-center gap-1.5 border border-border bg-card text-xs font-bold py-2 px-3.5 rounded-xl hover:bg-muted active:scale-95 transition-all"
          >
            <FileDown className="w-4 h-4 text-indigo-500" />
            PDF Audit Report
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Stats summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Expenses</span>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-foreground">₹{totalSpent}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Sum of filtered logs</p>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Staff Salaries</span>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-foreground">₹{salarySpent}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Manager, cleaners & receptionist wages</p>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Electricity Bills</span>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-foreground">₹{electricitySpent}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">BESCOM main grid sub-meters</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search remarks text..."
            className="w-full bg-background border border-border rounded-xl py-2 pl-9 pr-4 text-xs text-foreground focus:border-indigo-500 transition-colors"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:border-indigo-500 transition-colors font-semibold"
        >
          <option value="ALL">All Categories</option>
          <option value="ELECTRICITY">Electricity Bill</option>
          <option value="WATER">Water Supply</option>
          <option value="MAINTENANCE">Maintenance / Repairs</option>
          <option value="SALARY">Staff Salaries</option>
          <option value="INTERNET">Internet Subscription</option>
          <option value="FOOD">Food Mess Supplies</option>
          <option value="CLEANING">Cleaning materials</option>
          <option value="OTHERS">Others</option>
        </select>
      </div>

      {/* Table view */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-bold">
                <th className="p-4">Date</th>
                <th className="p-4">Category</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Remarks</th>
                <th className="p-4">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-muted-foreground font-semibold">
                    No expense logs recorded.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-border hover:bg-muted/10 transition-colors font-semibold">
                    <td className="p-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        {new Date(exp.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-foreground">{exp.category}</td>
                    <td className="p-4 font-extrabold text-foreground text-sm">₹{exp.amount}</td>
                    <td className="p-4 italic text-muted-foreground">"{exp.remarks || ''}"</td>
                    <td className="p-4 text-muted-foreground">{exp.createdBy.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Expense */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-slide-up">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-extrabold">Record PG Expense</h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Expense Category</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-xs text-foreground font-semibold"
                >
                  <option value="ELECTRICITY">Electricity Bill</option>
                  <option value="WATER">Water Supply</option>
                  <option value="MAINTENANCE">Maintenance / Repairs</option>
                  <option value="SALARY">Staff Salaries</option>
                  <option value="INTERNET">Internet Subscription</option>
                  <option value="FOOD">Food Mess Supplies</option>
                  <option value="CLEANING">Cleaning materials</option>
                  <option value="OTHERS">Others</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Amount Spent (₹) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Remarks / Details</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. BESCOM bill paid for June"
                  rows={3}
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
                  {actionLoading ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
