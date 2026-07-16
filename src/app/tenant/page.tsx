'use client';

import React, { useState, useEffect } from 'react';
import {
  Home,
  CreditCard,
  FileText,
  AlertOctagon,
  PhoneCall,
  Download,
  UploadCloud,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Shield,
} from 'lucide-react';

export default function TenantDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'complaints' | 'settings'>('payments');
  
  // Submit payment modal fields
  const [showPayModal, setShowPayModal] = useState<any>(null); // holds payment object
  const [payMode, setPayMode] = useState('UPI');
  const [payTxnId, setPayTxnId] = useState('');
  const [payRemarks, setPayRemarks] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  // Submit complaint fields
  const [complaintCategory, setComplaintCategory] = useState('WATER');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Settings fields
  const [altPhone, setAltPhone] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/tenant/profile');
      const data = await res.json();
      setProfile(data);

      setAltPhone(data.altPhone || '');
      setEmergencyName(data.emergencyContactName || '');
      setEmergencyPhone(data.emergencyContactPhone || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handlePayProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTxnId) return alert('Transaction ID is required');
    setSubmittingPay(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: showPayModal.id,
          mode: payMode,
          transactionId: payTxnId,
          remarks: payRemarks,
          screenshotUrl: '/uploads/receipts/proof-' + Date.now() + '.jpg', // Mock local storage file path
        }),
      });

      if (res.ok) {
        alert('Payment proof uploaded successfully. Pending manager verification.');
        setShowPayModal(null);
        setPayTxnId('');
        setPayRemarks('');
        loadProfile();
      } else {
        alert('Proof submission failed');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingPay(false);
    }
  };

  const handleRaiseComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintDesc) return alert('Please enter a description');
    setSubmittingComplaint(true);

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: complaintCategory,
          description: complaintDesc,
          customerId: profile.id, // Linked customer ID
        }),
      });

      if (res.ok) {
        alert('Complaint ticket raised successfully');
        setComplaintDesc('');
        loadProfile();
      } else {
        alert('Failed to raise ticket');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingSettings(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/tenant/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          altPhone,
          emergencyContactName: emergencyName,
          emergencyContactPhone: emergencyPhone,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        loadProfile();
      } else {
        alert('Settings update failed');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingSettings(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Home className="w-8 h-8 animate-bounce text-blue-600" />
        <p className="text-sm font-semibold text-muted-foreground">Syncing guest profile dashboard...</p>
      </div>
    );
  }

  // Active stay calculations
  const activeStay = profile.allocations.find((a: any) => a.status === 'ACTIVE');
  const pendingBills = profile.payments.filter((p: any) => p.status === 'PENDING');
  const totalOutstanding = pendingBills.reduce((sum: number, p: any) => sum + p.amount, 0);

  return (
    <div className="space-y-6 text-xs font-semibold text-slate-800">
      
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Guest Portal
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-2">Welcome Back, {profile.name}</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Track stay durations, download invoices, raise service tickets, and submit receipts.
          </p>
        </div>

        {activeStay && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Allocated Bed</p>
              <h4 className="font-extrabold text-slate-800">Room {activeStay.room.roomNumber} - Bed {activeStay.bed.bedNumber.split('-')[1]}</h4>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            Outstanding Due
          </span>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-950">₹{totalOutstanding}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{pendingBills.length} unpaid billings</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Security Deposit Escrow
          </span>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-950">
              ₹{activeStay?.deposit?.paidAmount || 0}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Refundable escrow deposit</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            Complaints Status
          </span>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-950">
              {profile.complaints.filter((c: any) => c.status === 'PENDING').length}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Pending ticket resolutions</p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-1.5 px-6 py-3 font-bold text-xs border-r border-slate-200 transition-all ${
              activeTab === 'payments' ? 'bg-white text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Payments & Receipts
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex items-center gap-1.5 px-6 py-3 font-bold text-xs border-r border-slate-200 transition-all ${
              activeTab === 'complaints' ? 'bg-white text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            Complaints Register
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-6 py-3 font-bold text-xs transition-all ${
              activeTab === 'settings' ? 'bg-white text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            Contact Info Details
          </button>
        </div>

        <div className="p-6">
          {/* Active Tab Payments */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-slate-900">Invoices & Payment Records</h3>
                {profile.agreements.length > 0 && (
                  <a
                    href={`/agreements?agreementId=${profile.agreements[0].id}`}
                    target="_blank"
                    className="flex items-center gap-1 text-[10px] text-blue-600 font-bold hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download Signed Lease Agreement</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                      <th className="p-3">Billing Cycle</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.payments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500">
                          No bills generated yet.
                        </td>
                      </tr>
                    ) : (
                      profile.payments.map((p: any) => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">
                            {new Date(p.dueDate).toLocaleString('default', { month: 'long', year: 'numeric' })}
                          </td>
                          <td className="p-3">₹{p.amount}</td>
                          <td className="p-3 text-slate-500">
                            {new Date(p.dueDate).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                p.status === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : p.status === 'PENDING' && p.screenshotUrl
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}
                            >
                              {p.status === 'PENDING' && p.screenshotUrl ? 'Verifying' : p.status}
                            </span>
                          </td>
                          <td className="p-3">
                            {p.status === 'PENDING' && !p.screenshotUrl && (
                              <button
                                onClick={() => setShowPayModal(p)}
                                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1 rounded-lg"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>Upload Proof</span>
                              </button>
                            )}
                            {p.status === 'PAID' && (
                              <a
                                href={`/api/payments?receiptId=${p.id}`}
                                target="_blank"
                                className="flex items-center gap-1 text-slate-500 hover:text-slate-800"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Receipt</span>
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

          {/* Active Tab Complaints */}
          {activeTab === 'complaints' && (
            <div className="grid md:grid-cols-12 gap-6 items-start">
              
              {/* Form raise complaint */}
              <div className="md:col-span-5 bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-3">
                <h4 className="font-extrabold text-xs text-slate-800">Lodge Helpdesk Complaint Ticket</h4>
                
                <form onSubmit={handleRaiseComplaint} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Category</label>
                    <select
                      value={complaintCategory}
                      onChange={(e) => setComplaintCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    >
                      <option value="WATER">Water Supply</option>
                      <option value="ELECTRICITY">Electricity & Lighting</option>
                      <option value="CLEANING">Cleaning & Housekeeping</option>
                      <option value="INTERNET">Wi-Fi Internet</option>
                      <option value="FURNITURE">Bed/Furniture Repair</option>
                      <option value="OTHERS">Others</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Describe Issue</label>
                    <textarea
                      value={complaintDesc}
                      onChange={(e) => setComplaintDesc(e.target.value)}
                      placeholder="Explain what is broken or needs repair..."
                      rows={4}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingComplaint}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg"
                  >
                    {submittingComplaint ? 'Submitting ticket...' : 'Submit Ticket'}
                  </button>
                </form>
              </div>

              {/* History list */}
              <div className="md:col-span-7 space-y-4">
                <h4 className="font-extrabold text-xs text-slate-800">Your Past Ticket Logs</h4>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {profile.complaints.length === 0 ? (
                    <p className="text-slate-500 text-center py-6 bg-slate-50 rounded-xl border border-slate-200">
                      No complaints raised yet.
                    </p>
                  ) : (
                    profile.complaints.map((c: any) => (
                      <div key={c.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex justify-between items-start">
                        <div className="space-y-1 max-w-[80%]">
                          <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {c.category}
                          </span>
                          <p className="text-xs font-semibold text-slate-800 mt-2">{c.description}</p>
                          <p className="text-[10px] text-slate-500">
                            Raised: {new Date(c.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                            c.status === 'RESOLVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Active Tab Settings */}
          {activeTab === 'settings' && (
            <div className="max-w-md">
              <h3 className="text-sm font-extrabold text-slate-900 mb-4 font-sans">Emergency & Secondary Contact Info</h3>
              
              <form onSubmit={handleSaveSettings} className="space-y-3.5">
                {saveSuccess && (
                  <p className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                    Profile settings saved successfully!
                  </p>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Secondary Contact Phone</label>
                  <input
                    type="text"
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Emergency Guardian Name</label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Emergency Guardian Phone</label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updatingSettings}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-5 rounded-lg text-xs"
                >
                  {updatingSettings ? 'Saving details...' : 'Save Profile details'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Submit payment proof modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white border border-slate-200 max-w-sm w-full p-6 rounded-2xl shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Upload Billing Payment Proof</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Amount: ₹{showPayModal.amount} | Cycle:{' '}
                {new Date(showPayModal.dueDate).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            <form onSubmit={handlePayProof} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Payment Mode</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                >
                  <option value="UPI">UPI (GPay/PhonePe/Paytm)</option>
                  <option value="BANK_TRANSFER">Bank IMPS/NEFT</option>
                  <option value="CASH">Handed Cash to Manager</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Transaction ID / Reference Number</label>
                <input
                  type="text"
                  value={payTxnId}
                  onChange={(e) => setPayTxnId(e.target.value)}
                  placeholder="e.g. 9821812838192"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Remarks (Optional)</label>
                <input
                  type="text"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  placeholder="e.g. Sent from father's bank account"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(null)}
                  className="border border-slate-200 text-slate-600 font-bold px-4 py-1.5 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPay}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs"
                >
                  {submittingPay ? 'Submitting...' : 'Submit Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
