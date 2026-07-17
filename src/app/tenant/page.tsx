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
  AlertCircle,
  Plus,
  HelpCircle,
  Bug,
  Info,
  DollarSign,
  ChevronDown,
  UserCheck,
  Wifi,
  Copy,
} from 'lucide-react';

export default function TenantDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'agreements' | 'complaints' | 'bugs' | 'profile' | 'contact'>('payments');
  
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

  // Lease Agreement Application fields
  const [showLeaseModal, setShowLeaseModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'BASIC' | 'STANDARD' | 'PREMIUM'>('STANDARD');
  const [ownerName, setOwnerName] = useState('');
  const [ownerAadhar, setOwnerAadhar] = useState('');
  const [ownerPan, setOwnerPan] = useState('');
  const [leaseStart, setLeaseStart] = useState('');
  const [lockIn, setLockIn] = useState('6');
  const [notice, setNotice] = useState('30');
  const [leaseTxnId, setLeaseTxnId] = useState('');
  const [submittingLease, setSubmittingLease] = useState(false);

  // Pre-signed upload fields
  const [showUploadLease, setShowUploadLease] = useState(false);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState('');
  const [submittingUploadLease, setSubmittingUploadLease] = useState(false);

  // MagicTick tech support bug fields
  const [bugType, setBugType] = useState('BUG'); // BUG, APP_FEEDBACK, GENERAL_QUERY
  const [bugSubject, setBugSubject] = useState('');
  const [bugMessage, setBugMessage] = useState('');
  const [submittingBug, setSubmittingBug] = useState(false);

  // Settings & profile fields
  const [altPhone, setAltPhone] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileFatherName, setProfileFatherName] = useState('');
  const [profileMotherName, setProfileMotherName] = useState('');
  const [profileOccupation, setProfileOccupation] = useState('');
  const [profileCompanyName, setProfileCompanyName] = useState('');
  const [profilePermanentAddress, setProfilePermanentAddress] = useState('');
  const [profileCurrentAddress, setProfileCurrentAddress] = useState('');
  const [profilePincode, setProfilePincode] = useState('');
  const [profileNationality, setProfileNationality] = useState('');
  const [profileBloodGroup, setProfileBloodGroup] = useState('');
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/tenant/profile');
      const data = await res.json();
      setProfile(data);

      if (data && !data.error) {
        setAltPhone(data.altPhone || '');
        setEmergencyName(data.emergencyContactName || '');
        setEmergencyPhone(data.emergencyContactPhone || '');
        setProfileName(data.name || '');
        setProfilePhone(data.phone || '');
        setProfileFatherName(data.fatherName || '');
        setProfileMotherName(data.motherName || '');
        setProfileOccupation(data.occupation || '');
        setProfileCompanyName(data.companyName || '');
        setProfilePermanentAddress(data.permanentAddress || '');
        setProfileCurrentAddress(data.currentAddress || '');
        setProfilePincode(data.pincode || '');
        setProfileNationality(data.nationality || '');
        setProfileBloodGroup(data.bloodGroup || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['payments', 'agreements', 'complaints', 'bugs', 'profile', 'contact'].includes(hash)) {
        setActiveTab(hash as any);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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
          screenshotUrl: '/uploads/receipts/proof-' + Date.now() + '.jpg',
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
          customerId: profile.id,
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

  const handleApplyAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName || !ownerAadhar || !ownerPan || !leaseStart || !leaseTxnId) {
      return alert('Please fill in all agreement details and payment proof transaction ID');
    }
    setSubmittingLease(true);

    const price = selectedPlan === 'BASIC' ? 199 : selectedPlan === 'STANDARD' ? 499 : 999;

    try {
      const res = await fetch('/api/tenant/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submitAgreementApplication: true,
          ownerName,
          ownerAadhar,
          ownerPan,
          propertyAddress: profile.property.address,
          propertyDetails: `Room ${profile.allocations.find((a: any) => a.status === 'ACTIVE')?.room?.roomNumber || 'Stay'} bed allocation`,
          startPeriod: leaseStart,
          lockInMonths: lockIn,
          noticePeriodDays: notice,
          planType: selectedPlan,
          paymentProofUrl: `txn-${leaseTxnId}`,
        }),
      });

      if (res.ok) {
        alert('Agreement application submitted to MagicTick team!');
        setShowLeaseModal(false);
        setOwnerName('');
        setOwnerAadhar('');
        setOwnerPan('');
        setLeaseTxnId('');
        loadProfile();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit application');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingLease(false);
    }
  };

  const handleUploadExistingLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedPdfUrl) return alert('PDF Document URL is required');
    setSubmittingUploadLease(true);

    try {
      const res = await fetch('/api/tenant/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadExistingAgreement: true,
          uploadedPdfUrl,
        }),
      });

      if (res.ok) {
        alert('Lease agreement registered successfully!');
        setShowUploadLease(false);
        setUploadedPdfUrl('');
        loadProfile();
      } else {
        alert('Failed to register lease');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingUploadLease(false);
    }
  };

  const handleSubmitBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugSubject || !bugMessage) return alert('Subject and details are required');
    setSubmittingBug(true);

    try {
      const res = await fetch('/api/tenant/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: bugType,
          subject: bugSubject,
          message: bugMessage,
        }),
      });

      if (res.ok) {
        alert('Bug/Query reported to MagicTick developer team. We will review it shortly!');
        setBugSubject('');
        setBugMessage('');
        loadProfile();
      } else {
        alert('Failed to submit ticket');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingBug(false);
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
          name: profileName,
          phone: profilePhone,
          fatherName: profileFatherName,
          motherName: profileMotherName,
          occupation: profileOccupation,
          companyName: profileCompanyName,
          permanentAddress: profilePermanentAddress,
          currentAddress: profileCurrentAddress,
          pincode: profilePincode,
          nationality: profileNationality,
          bloodGroup: profileBloodGroup,
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Home className="w-8 h-8 animate-bounce text-blue-600" />
        <p className="text-sm font-semibold text-slate-500">Syncing guest profile dashboard...</p>
      </div>
    );
  }

  if (!profile || profile.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 bg-white border border-slate-200 rounded-2xl p-8 max-w-md mx-auto shadow-sm text-center">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <div>
          <h3 className="font-extrabold text-sm text-slate-900">Portal Syncing Error</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {profile?.error || 'Unable to load tenant customer details. Please verify your account link.'}
          </p>
        </div>
      </div>
    );
  }

  const activeStay = profile.allocations?.find((a: any) => a.status === 'ACTIVE');
  const pendingBills = profile.payments?.filter((p: any) => p.status === 'PENDING') || [];
  const totalOutstanding = pendingBills.reduce((sum: number, p: any) => sum + p.amount, 0);
  const agreements = profile.agreements || [];
  const complaints = profile.complaints || [];
  const payments = profile.payments || [];
  const appQueries = profile.appQueries || [];
  
  // Custom UPI Billing QR fallback generator
  const upiId = profile.property?.settings?.upiId || 'owner@upi';
  const upiQrUrl = profile.property?.settings?.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${upiId}&pn=PGOwner`;

  return (
    <div className="space-y-6 text-xs font-semibold text-slate-800">
      
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {profile.property?.name || 'Guest Portal'}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-2">Welcome Back, {profile.name}</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Track stays, verify billings, generate stamped lease agreements, and log helpdesk tickets.
          </p>
        </div>

        {activeStay && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Allocated Bed</p>
              <h4 className="font-extrabold text-slate-800">
                Room {activeStay.room.roomNumber} - Bed {activeStay.bed.bedNumber.split('-')[1]}
              </h4>
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
            Active Complaints
          </span>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-950">
              {complaints.filter((c: any) => c.status === 'PENDING').length}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Pending ticket resolutions</p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
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
            onClick={() => setActiveTab('agreements')}
            className={`flex items-center gap-1.5 px-6 py-3 font-bold text-xs border-r border-slate-200 transition-all ${
              activeTab === 'agreements' ? 'bg-white text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Rent Agreements
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex items-center gap-1.5 px-6 py-3 font-bold text-xs border-r border-slate-200 transition-all ${
              activeTab === 'complaints' ? 'bg-white text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            Room Complaints
          </button>
          <button
            onClick={() => setActiveTab('bugs')}
            className={`flex items-center gap-1.5 px-6 py-3 font-bold text-xs border-r border-slate-200 transition-all ${
              activeTab === 'bugs' ? 'bg-white text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bug className="w-4 h-4" />
            MagicTick Support Desk
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-6 py-3 font-bold text-xs border-r border-slate-200 transition-all ${
              activeTab === 'profile' ? 'bg-white text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            My Profile
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-1.5 px-6 py-3 font-bold text-xs transition-all ${
              activeTab === 'contact' ? 'bg-white text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            PG Info &amp; Wi-Fi
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900">Invoices & Payment Records</h3>

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
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500">
                          No bills generated yet.
                        </td>
                      </tr>
                    ) : (
                      payments.map((p: any) => (
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
                                <span>Pay Now</span>
                              </button>
                            )}
                            {p.status === 'PAID' && (
                              <a
                                href={`/receipt/${p.id}`}
                                target="_blank"
                                className="flex items-center gap-1 text-blue-600 hover:underline font-bold"
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

          {/* TAB 2: AGREEMENTS */}
          {activeTab === 'agreements' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-sans">Stamp Rent Agreement Module</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Apply for legal lease drafting or submit pre-signed records.</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLeaseModal(true)}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-1.5 rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Apply for Stamp Lease</span>
                  </button>
                  <button
                    onClick={() => setShowUploadLease(true)}
                    className="flex items-center gap-1 bg-slate-100 border hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-1.5 rounded-xl"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload Signed Agreement</span>
                  </button>
                </div>
              </div>

              {/* Agreements List */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-slate-800">Agreement Database Records</h4>
                
                {agreements.length === 0 ? (
                  <p className="text-slate-500 text-center py-6 bg-slate-50 rounded-xl border border-slate-200">
                    No agreements registered. Click above to apply or upload your signed contract.
                  </p>
                ) : (
                  agreements.map((a: any) => (
                    <div key={a.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-slate-900 bg-slate-50 border px-1.5 py-0.5 rounded">
                            {a.agreementId}
                          </span>
                          <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {a.planType || 'MANUAL UPLOAD'}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-700 mt-2">Owner: {a.ownerName}</h4>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Period: {new Date(a.startPeriod).toLocaleDateString()} to {new Date(a.endPeriod).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Draft Status</p>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest block mt-1 ${
                              a.superAdminStatus === 'GENERATED' || a.status === 'SIGNED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}
                          >
                            {a.superAdminStatus === 'PENDING' ? 'Processing by MagicTick team' : a.superAdminStatus}
                          </span>
                        </div>

                        {(a.superAdminStatus === 'GENERATED' || a.status === 'SIGNED') && a.generatedPdfUrl && (
                          <a
                            href={a.generatedPdfUrl}
                            target="_blank"
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold p-2.5 rounded-xl shadow-sm"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMPLAINTS */}
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
                <h4 className="font-extrabold text-xs text-slate-800">Your Past Room Tickets</h4>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {complaints.length === 0 ? (
                    <p className="text-slate-500 text-center py-6 bg-slate-50 rounded-xl border border-slate-200">
                      No complaints raised yet.
                    </p>
                  ) : (
                    complaints.map((c: any) => (
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

          {/* TAB 4: MAGIC TICK SUPPORT BUGS */}
          {activeTab === 'bugs' && (
            <div className="grid md:grid-cols-12 gap-6 items-start">
              
              {/* Form raise bug query */}
              <div className="md:col-span-5 bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-3">
                <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1">
                  <Bug className="w-4 h-4 text-rose-500" />
                  Report Software Glitch or Query
                </h4>
                <p className="text-[10px] text-slate-500">
                  These tickets route directly to the **MagicTick software developer team** to debug website glitches or handle service issues.
                </p>
                
                <form onSubmit={handleSubmitBug} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Issue Type</label>
                    <select
                      value={bugType}
                      onChange={(e) => setBugType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    >
                      <option value="BUG">Technical Bug / Website Glitch</option>
                      <option value="APP_FEEDBACK">App Feature Suggestion</option>
                      <option value="GENERAL_QUERY">Billing / Subscription Query</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Subject</label>
                    <input
                      type="text"
                      required
                      value={bugSubject}
                      onChange={(e) => setBugSubject(e.target.value)}
                      placeholder="e.g. Receipt upload button crashes"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Message Details</label>
                    <textarea
                      value={bugMessage}
                      onChange={(e) => setBugMessage(e.target.value)}
                      placeholder="Describe exactly what happened or what you need..."
                      rows={4}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingBug}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg"
                  >
                    {submittingBug ? 'Reporting bug...' : 'Report Bug to MagicTick'}
                  </button>
                </form>
              </div>

              {/* History list */}
              <div className="md:col-span-7 space-y-4">
                <h4 className="font-extrabold text-xs text-slate-800">MagicTick Developer Support Logs</h4>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {appQueries.length === 0 ? (
                    <p className="text-slate-500 text-center py-6 bg-slate-50 rounded-xl border border-slate-200">
                      No software bug tickets logged.
                    </p>
                  ) : (
                    appQueries.map((q: any) => (
                      <div key={q.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex justify-between items-start">
                        <div className="space-y-1 max-w-[80%]">
                          <span className="text-[9px] font-extrabold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {q.type}
                          </span>
                          <h4 className="font-bold text-slate-800 mt-2">{q.subject}</h4>
                          <p className="text-xs text-slate-500">{q.message}</p>
                          <p className="text-[10px] text-slate-400">
                            Raised: {new Date(q.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                            q.status === 'RESOLVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: MY PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4">
              <div className="border-b pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 font-sans">Profile &amp; Personal Details Management</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Keep your resident profile details and contact directories up-to-date.</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                {saveSuccess && (
                  <p className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-center">
                    ✓ Your personal profile details have been successfully saved!
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Resident Name *</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Primary Phone *</label>
                    <input
                      type="text"
                      required
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Blood Group</label>
                    <input
                      type="text"
                      value={profileBloodGroup}
                      onChange={(e) => setProfileBloodGroup(e.target.value)}
                      placeholder="e.g. O+"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Father's Name</label>
                    <input
                      type="text"
                      value={profileFatherName}
                      onChange={(e) => setProfileFatherName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Mother's Name</label>
                    <input
                      type="text"
                      value={profileMotherName}
                      onChange={(e) => setProfileMotherName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Occupation</label>
                    <input
                      type="text"
                      value={profileOccupation}
                      onChange={(e) => setProfileOccupation(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Company Name</label>
                    <input
                      type="text"
                      value={profileCompanyName}
                      onChange={(e) => setProfileCompanyName(e.target.value)}
                      placeholder="N/A"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Nationality</label>
                    <input
                      type="text"
                      value={profileNationality}
                      onChange={(e) => setProfileNationality(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Alt Contact Phone</label>
                    <input
                      type="text"
                      value={altPhone}
                      onChange={(e) => setAltPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Emergency Guardian Name</label>
                    <input
                      type="text"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Emergency Guardian Phone</label>
                    <input
                      type="text"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3 border-t pt-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Current Address</label>
                    <input
                      type="text"
                      value={profileCurrentAddress}
                      onChange={(e) => setProfileCurrentAddress(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Permanent Address</label>
                      <input
                        type="text"
                        value={profilePermanentAddress}
                        onChange={(e) => setProfilePermanentAddress(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Address Pincode</label>
                      <input
                        type="text"
                        value={profilePincode}
                        onChange={(e) => setProfilePincode(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={updatingSettings}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm shadow-blue-500/10"
                  >
                    {updatingSettings ? 'Saving details...' : 'Save Profile Details'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: PG INFO & WI-FI */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              
              {/* Wi-Fi Details Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-md">
                    <Wifi className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-100/50 px-2 py-0.5 rounded uppercase tracking-wider">PG Wi-Fi Network</span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-1">SSID: {profile.property?.settings?.wifiName || 'MagicTick_Guest'}</h3>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Password: <span className="font-mono font-bold text-slate-800 bg-white border border-indigo-100 px-1.5 py-0.5 rounded">{profile.property?.settings?.wifiPassword || 'guest@123'}</span></p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(profile.property?.settings?.wifiPassword || 'guest@123');
                    alert('Wi-Fi Password copied to clipboard!');
                  }}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-indigo-700 font-bold border border-indigo-200 px-3.5 py-1.5 rounded-xl text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Wi-Fi Password</span>
                </button>
              </div>

              {/* Managers list */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-sans">PG Managers &amp; Owners Directory</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Get in touch directly with your property operators for queries or handovers.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(!profile.managers || profile.managers.length === 0) ? (
                    <p className="text-slate-500 text-center py-6 bg-slate-50 border rounded-xl col-span-2">
                      No registered managers found for this property.
                    </p>
                  ) : (
                    profile.managers.map((m: any, idx: number) => (
                      <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex justify-between items-center gap-4 animate-fade-in">
                        <div className="space-y-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            m.role === 'OWNER' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {m.role === 'OWNER' ? 'PG Owner' : 'PG Manager'}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-xs">{m.name}</h4>
                          <p className="text-[10px] text-slate-500 font-medium">Email: <a href={`mailto:${m.email}`} className="text-blue-600 hover:underline">{m.email}</a></p>
                          {m.phone && (
                            <p className="text-[10px] text-slate-500 font-medium">Phone: <a href={`tel:${m.phone}`} className="text-blue-600 hover:underline font-bold">{m.phone}</a></p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Pay invoice modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 font-sans overflow-y-auto">
          <div className="bg-white border border-slate-200 max-w-2xl w-full p-6 rounded-2xl shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center space-y-1 border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Direct PG Payment Portal</h3>
              <p className="text-[10px] text-slate-500">
                Billing Cycle:{' '}
                <span className="font-extrabold text-slate-800">
                  {new Date(showPayModal.dueDate).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>{' '}
                | Outstanding Amount:{' '}
                <span className="font-extrabold text-blue-600">₹{showPayModal.amount}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Settlement Info */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-wider">PG Settlement Bank Account</h4>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p>Account Name: <span className="font-bold text-slate-900">{profile.property?.settings?.bankAccountName || 'MagicTick PG Services'}</span></p>
                    <p>Account Number: <span className="font-mono font-bold text-slate-900 select-all">{profile.property?.settings?.bankAccountNumber || '1234567890'}</span></p>
                    <p>IFSC Code: <span className="font-mono font-bold text-slate-900 select-all">{profile.property?.settings?.bankIfscCode || 'UTIB0000123'}</span></p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <img
                    src={upiQrUrl}
                    alt="UPI Payment QR"
                    className="w-32 h-32 border border-indigo-200 p-1.5 rounded-lg bg-white"
                  />
                  <div className="text-center mt-1">
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Scan &amp; Pay via UPI app</p>
                    <p className="font-mono text-[10px] text-slate-700 font-bold select-all mt-0.5">{upiId}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Submission Form */}
              <form onSubmit={handlePayProof} className="space-y-3.5 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Payment Method Used</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white"
                  >
                    <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                    <option value="BANK_TRANSFER">Bank NetBanking IMPS/NEFT</option>
                    <option value="CASH">Handed Cash directly to Manager</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Transaction ID / Ref Number *</label>
                  <input
                    type="text"
                    required
                    value={payTxnId}
                    onChange={(e) => setPayTxnId(e.target.value)}
                    placeholder="Enter UPI reference or Bank Txn ID"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Remarks (Optional)</label>
                  <input
                    type="text"
                    value={payRemarks}
                    onChange={(e) => setPayRemarks(e.target.value)}
                    placeholder="Sent from self account"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t">
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
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-1.5 rounded-lg text-xs"
                  >
                    {submittingPay ? 'Submitting...' : 'I Have Paid'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Rent Agreement application modal */}
      {showLeaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 font-sans overflow-y-auto">
          <div className="bg-white border border-slate-200 max-w-md w-full p-6 rounded-2xl shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Apply for Stamp Lease Agreement</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Drafted digitally by the MagicTick developer team and linked to your profile.
              </p>
            </div>

            <form onSubmit={handleApplyAgreement} className="space-y-3.5">
              {/* Plan Selection */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase block">Select Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('BASIC')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      selectedPlan === 'BASIC'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-extrabold text-xs">Basic</p>
                    <p className="text-[10px] mt-1">₹199</p>
                    <p className="text-[8px] text-slate-400 mt-0.5 font-medium">Digital Sign</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('STANDARD')}
                    className={`p-2.5 rounded-xl border text-center transition-all relative ${
                      selectedPlan === 'STANDARD'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white font-extrabold text-[7px] px-1.5 py-0.5 rounded-full tracking-wider uppercase">
                      Best
                    </span>
                    <p className="font-extrabold text-xs mt-0.5">Standard</p>
                    <p className="text-[10px] mt-1">₹499</p>
                    <p className="text-[8px] text-slate-400 mt-0.5 font-medium">E-Stamp Sign</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('PREMIUM')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      selectedPlan === 'PREMIUM'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-extrabold text-xs">Premium</p>
                    <p className="text-[10px] mt-1">₹999</p>
                    <p className="text-[8px] text-slate-400 mt-0.5 font-medium">Notary Deliver</p>
                  </button>
                </div>
              </div>

              {/* Owner details */}
              <div className="grid grid-cols-2 gap-3 border-t pt-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Owner Full Name</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Lease Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaseStart}
                    onChange={(e) => setLeaseStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Owner Aadhaar Number</label>
                  <input
                    type="text"
                    required
                    value={ownerAadhar}
                    onChange={(e) => setOwnerAadhar(e.target.value)}
                    placeholder="12 digit Aadhaar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Owner PAN Number</label>
                  <input
                    type="text"
                    required
                    value={ownerPan}
                    onChange={(e) => setOwnerPan(e.target.value)}
                    placeholder="10 digit PAN"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* QR and UPI payment for Lease fee */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                <img
                  src={upiQrUrl}
                  alt="UPI QR"
                  className="w-20 h-20 border p-1 rounded bg-white"
                />
                <div className="space-y-1">
                  <p className="text-[9px] text-slate-500 uppercase">Drafting Fee UPI Payment</p>
                  <p className="text-xs font-extrabold text-slate-900">
                    Pay: ₹{selectedPlan === 'BASIC' ? 199 : selectedPlan === 'STANDARD' ? 499 : 999}
                  </p>
                  <p className="font-mono text-[10px] text-slate-600 select-all">{upiId}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Payment Transaction ID</label>
                <input
                  type="text"
                  required
                  value={leaseTxnId}
                  onChange={(e) => setLeaseTxnId(e.target.value)}
                  placeholder="Enter the payment transaction ID"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowLeaseModal(false)}
                  className="border border-slate-200 text-slate-600 font-bold px-4 py-1.5 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLease}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-1.5 rounded-lg text-xs"
                >
                  {submittingLease ? 'Submitting Application...' : 'Apply & Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload pre-signed agreement modal */}
      {showUploadLease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 font-sans overflow-y-auto">
          <div className="bg-white border border-slate-200 max-w-sm w-full p-6 rounded-2xl shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Upload Pre-Existing Signed Agreement</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Paste the URL of your signed lease agreement PDF.
              </p>
            </div>

            <form onSubmit={handleUploadExistingLease} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Lease Document PDF URL</label>
                <input
                  type="url"
                  required
                  value={uploadedPdfUrl}
                  onChange={(e) => setUploadedPdfUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadLease(false)}
                  className="border border-slate-200 text-slate-600 font-bold px-4 py-1.5 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUploadLease}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs"
                >
                  {submittingUploadLease ? 'Registering...' : 'Register Lease'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
