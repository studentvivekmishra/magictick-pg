'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  PlusCircle,
  FileCheck,
  Clock,
  AlertTriangle,
  Upload,
  Check,
  X,
  Sparkles,
  Info,
  ExternalLink,
  DollarSign,
  User,
  Activity,
  UserCheck,
} from 'lucide-react';

interface Payment {
  id: string;
  dueDate: string;
  paidDate: string | null;
  amount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL';
  mode: 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'CARD' | null;
  referenceNumber: string | null;
  transactionId: string | null;
  screenshotUrl: string | null;
  lateFee: number;
  discount: number;
  remarks: string | null;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  roomAllocation: {
    room: {
      roomNumber: string;
    };
    bed: {
      bedNumber: string;
    };
  };
  verification?: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLARIFICATION_NEEDED';
    managerRemarks: string | null;
    verifiedAt: string | null;
    verifiedBy: string | null;
  };
}

interface UserSession {
  userId: string;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST';
}

export default function PaymentsPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'QUEUE'>('LEDGER');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PAID, PENDING, OVERDUE

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Upload receipt fields
  const [uploadMode, setUploadMode] = useState<'UPI' | 'CASH' | 'BANK_TRANSFER' | 'CARD'>('UPI');
  const [uploadRef, setUploadRef] = useState('');
  const [uploadTxn, setUploadTxn] = useState('');
  const [uploadScreenshot, setUploadScreenshot] = useState('');
  const [uploadRemarks, setUploadRemarks] = useState('');

  // Verification fields
  const [verifyStatus, setVerifyStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [verifyDiscount, setVerifyDiscount] = useState('0');
  const [verifyLateFee, setVerifyLateFee] = useState('0');

  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      const resSession = await fetch('/api/auth');
      const sessionData = await resSession.json();
      if (sessionData.authenticated) {
        setSession(sessionData.user);
      }

      const resPayments = await fetch(`/api/payments?status=${statusFilter}&search=${search}`);
      const paymentsData = await resPayments.json();
      setPayments(paymentsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, search]);

  const handleBatchGenerate = async () => {
    if (!confirm('Are you sure you want to run invoice generation for all active room allocations?')) return;
    try {
      const res = await fetch('/api/payments', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Successfully generated ${data.createdInvoices} monthly rent invoices!`);
        loadData();
      } else {
        alert(data.error || 'Failed to generate invoices');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    if (!selectedPayment || !uploadScreenshot) {
      alert('Screenshot URL/file proof is required');
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          uploadReceipt: true,
          mode: uploadMode,
          referenceNumber: uploadRef,
          transactionId: uploadTxn,
          screenshotUrl: uploadScreenshot,
          remarks: uploadRemarks,
        }),
      });

      if (res.ok) {
        setIsUploadOpen(false);
        setUploadRef('');
        setUploadTxn('');
        setUploadScreenshot('');
        setUploadRemarks('');
        loadData();
      } else {
        alert('Upload proof failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    if (!selectedPayment) return;

    try {
      const res = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          verifyAction: verifyStatus,
          managerRemarks: verifyRemarks,
          discount: verifyDiscount,
          lateFee: verifyLateFee,
        }),
      });

      if (res.ok) {
        setIsVerifyOpen(false);
        setVerifyRemarks('');
        setVerifyDiscount('0');
        setVerifyLateFee('0');
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Verification failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <CreditCard className="w-8 h-8 animate-bounce text-indigo-500" />
        <p className="text-sm font-semibold text-muted-foreground">Loading invoice ledgers...</p>
      </div>
    );
  }

  const isStaff = session.role === 'RECEPTIONIST';
  const canGenerate = session.role === 'OWNER' || session.role === 'MANAGER';

  // Filter verification queue
  const queuePayments = payments.filter((p) => p.verification?.status === 'PENDING' && p.screenshotUrl);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Payments & Invoices</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track guest billings, upload transaction receipts, and verify UPI screenshots.
          </p>
        </div>

        {canGenerate && (
          <button
            onClick={handleBatchGenerate}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Batch Generate Invoices
          </button>
        )}
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-border gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'LEDGER' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Invoice Ledger
        </button>
        <button
          onClick={() => setActiveTab('QUEUE')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'QUEUE' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Verification Queue</span>
          {queuePayments.length > 0 && (
            <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
              {queuePayments.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'LEDGER' ? (
        <div className="space-y-4">
          {/* Filters and Search */}
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
              <option value="ALL">All Payments</option>
              <option value="PAID">Paid Invoices</option>
              <option value="PENDING">Pending Invoices</option>
              <option value="OVERDUE">Overdue Invoices</option>
            </select>
          </div>

          {/* Ledger Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto responsive-table">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground font-bold">
                    <th className="p-4">Tenant</th>
                    <th className="p-4">Room/Bed</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-muted-foreground font-semibold">
                        No payments found in ledger database.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => {
                      let statusBadge = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                      if (p.status === 'PAID') statusBadge = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                      if (p.status === 'OVERDUE') statusBadge = 'bg-rose-500/10 text-rose-500 border-rose-500/20';

                      return (
                        <tr key={p.id} className="border-b border-border hover:bg-muted/10 transition-colors font-semibold">
                          <td className="p-4" data-label="Tenant">
                            <p className="font-bold text-sm text-foreground">{p.customer.name}</p>
                            <span className="text-[10px] text-muted-foreground">{p.customer.phone}</span>
                          </td>
                          <td className="p-4" data-label="Room/Bed">
                            Room {p.roomAllocation.room.roomNumber} (Bed {p.roomAllocation.bed.bedNumber.split('-')[1]})
                          </td>
                          <td className="p-4" data-label="Due Date">
                            {new Date(p.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="p-4 font-extrabold text-foreground text-sm" data-label="Amount">
                            ₹{p.amount + p.lateFee - p.discount}
                          </td>
                          <td className="p-4" data-label="Status">
                            <span className={`px-2.5 py-0.5 rounded-full border text-[9px] uppercase tracking-wider font-bold ${statusBadge}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-4" data-label="Action">
                            {p.status === 'PENDING' ? (
                              <div className="flex flex-col sm:flex-row gap-1.5 md:gap-2 justify-end md:justify-start w-full">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPayment(p);
                                    setIsUploadOpen(true);
                                  }}
                                  className="flex items-center justify-center gap-1 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all w-full sm:w-auto"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  Upload proof
                                </button>

                                {!isStaff && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedPayment(p);
                                      setVerifyStatus('APPROVED');
                                      setIsVerifyOpen(true);
                                    }}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-md shadow-emerald-500/10 active:scale-95 transition-all w-full sm:w-auto text-center"
                                  >
                                    Verify Manually
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold justify-end md:justify-start">
                                <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                                Paid ({p.mode || 'CASH'})
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Verification queue splits */
        <div className="grid md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-4 bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">
              Pending verifications ({queuePayments.length})
            </h3>

            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {queuePayments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10 font-semibold">
                  Queue is clear! No payments awaiting verification.
                </p>
              ) : (
                queuePayments.map((p) => {
                  const isSelected = selectedPayment?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPayment(p);
                        setVerifyStatus('APPROVED');
                      }}
                      className={`w-full flex justify-between items-center p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-300'
                          : 'bg-background/20 border-border/80 hover:bg-muted/40'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm text-foreground">{p.customer.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Room {p.roomAllocation.room.roomNumber} • Rent ₹{p.amount}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase shrink-0">
                        PENDING
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="md:col-span-8">
            {selectedPayment && selectedPayment.screenshotUrl ? (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <div>
                    <h3 className="text-base font-extrabold text-foreground">Reviewing Payment</h3>
                    <p className="text-xs text-muted-foreground">
                      Submitted by {selectedPayment.customer.name} (Phone: {selectedPayment.customer.phone})
                    </p>
                  </div>
                  {!isStaff && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setVerifyStatus('APPROVED');
                          setIsVerifyOpen(true);
                        }}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3.5 rounded-xl text-xs active:scale-95 transition-all shadow-md shadow-emerald-500/10"
                      >
                        <Check className="w-4 h-4" />
                        Approve Payment
                      </button>
                      <button
                        onClick={() => {
                          setVerifyStatus('REJECTED');
                          setIsVerifyOpen(true);
                        }}
                        className="flex items-center gap-1 border border-rose-500/20 text-rose-500 hover:bg-rose-500/5 font-bold py-2 px-3.5 rounded-xl text-xs active:scale-95 transition-all"
                      >
                        <X className="w-4 h-4" />
                        Reject Proof
                      </button>
                    </div>
                  )}
                </div>

                {/* Info side by side layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Screenshot display */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
                      Transaction Screenshot Proof
                    </span>
                    <div className="aspect-[4/5] border rounded-xl overflow-hidden relative bg-zinc-100 flex items-center justify-center shadow-inner">
                      <img
                        src={selectedPayment.screenshotUrl}
                        alt="Rent Payment Screenshot"
                        className="w-full h-full object-contain"
                      />
                      <a
                        href={selectedPayment.screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-2 right-2 bg-black/60 text-white p-2 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-black"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Original
                      </a>
                    </div>
                  </div>

                  {/* Transaction metadata */}
                  <div className="space-y-4">
                    <div className="space-y-3 bg-muted/40 border border-border p-4 rounded-xl text-xs font-semibold">
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block border-b pb-1.5">
                        Transaction details
                      </span>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Mode:</span>
                        <span className="font-extrabold text-foreground">{selectedPayment.mode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction ID:</span>
                        <span className="font-extrabold text-foreground">{selectedPayment.transactionId || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reference/Ref No:</span>
                        <span className="font-extrabold text-foreground">{selectedPayment.referenceNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rent Invoiced:</span>
                        <span className="font-extrabold text-foreground">₹{selectedPayment.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Remarks:</span>
                        <span className="font-bold text-foreground text-right italic">
                          "{selectedPayment.remarks || 'No remarks provided.'}"
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-16 shadow-sm text-center">
                <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3 animate-pulse-subtle" />
                <p className="text-sm font-semibold text-muted-foreground">Select a pending request from queue to review details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Upload Proof */}
      {isUploadOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-slide-up">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-extrabold">Submit Payment Proof</h3>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Mode of Payment</label>
                  <select
                    value={uploadMode}
                    onChange={(e: any) => setUploadMode(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground font-semibold"
                  >
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CARD">Debit/Credit Card</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Transaction ID</label>
                  <input
                    type="text"
                    value={uploadTxn}
                    onChange={(e) => setUploadTxn(e.target.value)}
                    placeholder="e.g. TXN2938102"
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground animate-fade-in"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Reference Number</label>
                <input
                  type="text"
                  value={uploadRef}
                  onChange={(e) => setUploadRef(e.target.value)}
                  placeholder="e.g. UPI Ref 382901"
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Receipt Screenshot URL *</label>
                <input
                  type="text"
                  required
                  value={uploadScreenshot}
                  onChange={(e) => setUploadScreenshot(e.target.value)}
                  placeholder="https://example.com/receipt.jpg"
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Guest remarks</label>
                <textarea
                  value={uploadRemarks}
                  onChange={(e) => setUploadRemarks(e.target.value)}
                  rows={2}
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="py-2 px-4 rounded-xl border border-border text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Uploading...' : 'Submit Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Verify Action (Approve / Reject) */}
      {isVerifyOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-slide-up">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-extrabold">Verify Payment</h3>
              </div>
              <button
                onClick={() => setIsVerifyOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Late Fee (₹)</label>
                  <input
                    type="number"
                    value={verifyLateFee}
                    onChange={(e) => setVerifyLateFee(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Discount Override (₹)</label>
                  <input
                    type="number"
                    value={verifyDiscount}
                    onChange={(e) => setVerifyDiscount(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Decision Remarks</label>
                <textarea
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  placeholder="e.g. Verified. Bank reference matched."
                  rows={2}
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVerifyOpen(false)}
                  className="py-2 px-4 rounded-xl border border-border text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`text-white font-bold py-2.5 px-4 rounded-xl text-xs disabled:opacity-50 ${
                    verifyStatus === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/10' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {actionLoading ? 'Saving...' : verifyStatus === 'APPROVED' ? 'Confirm Approval' : 'Reject Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
