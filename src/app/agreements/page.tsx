'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  FileDown,
  Clock,
  User,
  Plus,
  AlertTriangle,
  Building,
  CheckCircle,
  X,
  Sparkles,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Agreement {
  id: string;
  agreementId: string;
  ownerName: string;
  ownerAadhar: string;
  ownerPan: string;
  ownerSignatureUrl: string;
  propertyAddress: string;
  propertyDetails: string;
  tenantSignatureUrl: string;
  status: 'PENDING' | 'SIGNED' | 'EXPIRED';
  startPeriod: string;
  endPeriod: string;
  lockInMonths: number;
  noticePeriodDays: number;
  electricityCharges: string;
  waterCharges: string;
  maintenanceCharges: string;
  rulesText: string;
  qrCodeUrl: string;
  expiresAt: string;
  downloadAvailable: boolean;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    permanentAddress: string;
  };
  roomAllocation: {
    rentOverride: number | null;
    room: {
      roomNumber: string;
      defaultPrice: number;
    };
  };
}

interface TenantOption {
  id: string;
  name: string;
  allocations: Array<{
    id: string;
    status: string;
    rentOverride: number | null;
    room: {
      roomNumber: string;
      defaultPrice: number;
    };
  }>;
}

interface UserSession {
  userId: string;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST';
}

export default function AgreementsPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'BUILDER' | 'HISTORY'>('HISTORY');

  // Generator form fields
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedAllocationId, setSelectedAllocationId] = useState('');
  const [landlordName, setLandlordName] = useState('Ramesh Kumar');
  const [landlordAadhar, setLandlordAadhar] = useState('1122 3344 5566');
  const [landlordPan, setLandlordPan] = useState('ABCDE1234F');
  const [propertyAddress, setPropertyAddress] = useState('NEXUS PG, Sector 5, HSR Layout, Bengaluru, Karnataka');
  const [lockIn, setLockIn] = useState('6');
  const [notice, setNotice] = useState('30');
  const [electricity, setElectricity] = useState('As per sub-meter (₹10/unit)');
  const [water, setWater] = useState('Flat ₹200/month');
  const [maintenance, setMaintenance] = useState('Included in rent');
  const [rules, setRules] = useState('No smoking inside. Quiet hours after 10 PM. No visitor night stay without permission.');

  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Hidden print reference
  const printRef = useRef<HTMLDivElement>(null);
  const [printingAgreement, setPrintingAgreement] = useState<Agreement | null>(null);

  const loadData = async () => {
    try {
      const resSession = await fetch('/api/auth');
      const sessionData = await resSession.json();
      if (sessionData.authenticated) {
        setSession(sessionData.user);
      }

      // Fetch agreements
      const resAgreements = await fetch('/api/agreements');
      const agreementsData = await resAgreements.json();
      setAgreements(agreementsData);

      // Fetch active tenants options for dropdown (who don't already have signed leases)
      const resCustomers = await fetch('/api/customers?status=ACTIVE');
      const customersData = await resCustomers.json();
      
      // Filter out tenants that already have an active agreement
      const filteredTenants = customersData.filter((c: any) => {
        const hasAgreement = agreementsData.some((a: any) => a.customerId === c.id && a.status !== 'EXPIRED');
        return !hasAgreement;
      });
      setTenantOptions(filteredTenants);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);

    if (!selectedCustomerId || !selectedAllocationId) {
      setFormError('Please select a tenant stay allocation');
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/agreements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          roomAllocationId: selectedAllocationId,
          ownerName: landlordName,
          ownerAadhar: landlordAadhar,
          ownerPan: landlordPan,
          propertyAddress,
          propertyDetails: `NEXUS PG Accommodation stay`,
          lockInMonths: lockIn,
          noticePeriodDays: notice,
          electricityCharges: electricity,
          waterCharges: water,
          maintenanceCharges: maintenance,
          rulesText: rules,
        }),
      });

      if (res.ok) {
        setSelectedCustomerId('');
        setSelectedAllocationId('');
        setActiveTab('HISTORY');
        loadData();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Agreement generation failed');
      }
    } catch (err) {
      setFormError('Failed to save agreement details.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = async (agreement: Agreement) => {
    setPrintingAgreement(agreement);
    // Give state brief moment to bind HTML element template
    setTimeout(async () => {
      if (!printRef.current) return;
      try {
        const canvas = await html2canvas(printRef.current, { scale: 2, logging: false });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        pdf.save(`RentAgreement_${agreement.agreementId}.pdf`);
      } catch (e) {
        console.error(e);
        alert('PDF compilation failed.');
      } finally {
        setPrintingAgreement(null);
      }
    }, 300);
  };

  if (loading || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <FileText className="w-8 h-8 animate-bounce text-indigo-500" />
        <p className="text-sm font-semibold text-muted-foreground">Loading lease directories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Rent Lease Agreements</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Generate legally binding rent agreements, pre-populate parameters, and manage download availability timers.
          </p>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-border gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'HISTORY' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Agreement History
        </button>
        <button
          onClick={() => setActiveTab('BUILDER')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'BUILDER' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Agreement Generator Form
        </button>
      </div>

      {activeTab === 'HISTORY' ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-bold">
                  <th className="p-4">Agreement ID</th>
                  <th className="p-4">Tenant</th>
                  <th className="p-4">Start / End Period</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Download Expiry</th>
                  <th className="p-4">Download PDF</th>
                </tr>
              </thead>
              <tbody>
                {agreements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-muted-foreground font-semibold">
                      No agreements generated yet. Go to Form tab to generate one.
                    </td>
                  </tr>
                ) : (
                  agreements.map((agr) => {
                    let statusBadge = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                    if (agr.status === 'EXPIRED') statusBadge = 'bg-rose-500/10 text-rose-500 border-rose-500/20';

                    return (
                      <tr key={agr.id} className="border-b border-border hover:bg-muted/10 transition-colors font-semibold">
                        <td className="p-4 font-bold text-sm text-foreground">{agr.agreementId}</td>
                        <td className="p-4">
                          <p className="font-bold text-foreground">{agr.customer.name}</p>
                          <span className="text-[10px] text-muted-foreground">{agr.customer.phone}</span>
                        </td>
                        <td className="p-4">
                          {new Date(agr.startPeriod).toLocaleDateString()} - {new Date(agr.endPeriod).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full border text-[9px] uppercase tracking-wider font-bold ${statusBadge}`}>
                            {agr.status}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {agr.expiresAt ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-indigo-500" />
                              {new Date(agr.expiresAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleDownloadPDF(agr)}
                            disabled={!agr.downloadAvailable}
                            className="flex items-center gap-1 bg-indigo-600 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-muted-foreground hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] shadow-sm disabled:shadow-none active:scale-95 transition-all"
                            title={!agr.downloadAvailable ? 'Agreement download window expired (48h past)' : 'Download PDF'}
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            {!agr.downloadAvailable ? 'Expired' : 'Download'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Form view */
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleCreateAgreement} className="space-y-6 text-xs font-semibold">
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2 px-3 rounded-xl font-medium">
                {formError}
              </div>
            )}

            {/* Select stay allocation */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-indigo-500 uppercase tracking-widest border-b pb-1">
                1. Select Guest Allocation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Active Tenant *</label>
                  <select
                    value={selectedCustomerId}
                    required
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      const t = tenantOptions.find((to) => to.id === e.target.value);
                      const activeAlloc = t?.allocations.find((a) => a.status === 'ACTIVE');
                      setSelectedAllocationId(activeAlloc?.id || '');
                    }}
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-xs text-foreground font-semibold"
                  >
                    <option value="">-- Select Active Tenant --</option>
                    {tenantOptions.map((to) => {
                      const activeAlloc = to.allocations.find((a) => a.status === 'ACTIVE');
                      return (
                        <option key={to.id} value={to.id}>
                          {to.name} {activeAlloc ? `(Room ${activeAlloc.room.roomNumber})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Landlord information */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-indigo-500 uppercase tracking-widest border-b pb-1">
                2. Landlord & Property details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Owner Name</label>
                  <input
                    type="text"
                    value={landlordName}
                    onChange={(e) => setLandlordName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Owner Aadhar</label>
                  <input
                    type="text"
                    value={landlordAadhar}
                    onChange={(e) => setLandlordAadhar(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Owner PAN</label>
                  <input
                    type="text"
                    value={landlordPan}
                    onChange={(e) => setLandlordPan(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Property Address</label>
                <textarea
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  rows={2}
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                />
              </div>
            </div>

            {/* Lease terms */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-indigo-500 uppercase tracking-widest border-b pb-1">
                3. Lease Clauses & Pricing Rules
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Lock-in Period (Months)</label>
                  <input
                    type="number"
                    value={lockIn}
                    onChange={(e) => setLockIn(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Notice Period (Days)</label>
                  <input
                    type="number"
                    value={notice}
                    onChange={(e) => setNotice(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Electricity Charges</label>
                  <input
                    type="text"
                    value={electricity}
                    onChange={(e) => setElectricity(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Water Charges</label>
                  <input
                    type="text"
                    value={water}
                    onChange={(e) => setWater(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Maintenance</label>
                  <input
                    type="text"
                    value={maintenance}
                    onChange={(e) => setMaintenance(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">PG House Rules</label>
                <textarea
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  rows={2}
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
              >
                {actionLoading ? 'Generating agreement...' : 'Generate Rent Agreement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Off-screen legal document printable component (A4 Size) */}
      {printingAgreement && (
        <div className="absolute top-0 left-0 w-full pointer-events-none opacity-0 z-0">
          <div
            ref={printRef}
            className="w-[210mm] p-[25mm] bg-white text-zinc-900 leading-relaxed space-y-8 font-serif"
            style={{ minHeight: '297mm' }}
          >
            {/* Header Stamp Paper Simulator */}
            <div className="border-4 border-double border-zinc-800 p-4 text-center space-y-1">
              <h1 className="text-3xl font-extrabold tracking-widest uppercase text-zinc-900">
                Rent Agreement
              </h1>
              <p className="text-xs uppercase font-bold tracking-widest text-zinc-700">
                State of Karnataka • HSR Layout Registry
              </p>
              <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1">
                <span>Unique ID: {printingAgreement.agreementId}</span>
                <span>Date: {new Date(printingAgreement.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Parties clause */}
            <div className="space-y-4 text-sm text-justify">
              <p>
                This Rent Agreement is made and executed on this{' '}
                <strong>{new Date(printingAgreement.createdAt).toLocaleDateString()}</strong> by and between:
              </p>
              <p>
                <strong>LANDLORD:</strong> Shri <strong>{printingAgreement.ownerName}</strong>, bearing Aadhaar Number{' '}
                {printingAgreement.ownerAadhar} and PAN card {printingAgreement.ownerPan}, hereinafter referred to as the
                "First Party".
              </p>
              <p>
                <strong>AND TENANT:</strong> Shri/Kumari <strong>{printingAgreement.customer.name}</strong>, bearing Aadhaar Number
                (verified in KYC documents database), permanent resident of {printingAgreement.customer.permanentAddress},
                hereinafter referred to as the "Second Party".
              </p>
              <p>
                WHEREAS the First Party is the lawful owner of the accommodation located at{' '}
                <strong>{printingAgreement.propertyAddress}</strong> (herein referred to as the "Premises") and has agreed to let out
                the accommodation <strong>Room {printingAgreement.roomAllocation.room.roomNumber}</strong> under sharing type{' '}
                <strong>{printingAgreement.roomAllocation.room.roomNumber ? 'PG Room Allocation' : 'Sharing'}</strong> to the Second
                Party on a monthly lease basis.
              </p>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-3.5 text-sm">
              <h3 className="font-extrabold uppercase text-xs border-b pb-1 text-zinc-800">
                Terms and Conditions
              </h3>
              <ol className="list-decimal list-inside space-y-2.5 text-justify">
                <li>
                  <strong>Rent billing:</strong> The Second Party agrees to pay the First Party a monthly rent sum of{' '}
                  <strong>₹{printingAgreement.roomAllocation.rentOverride || printingAgreement.roomAllocation.room.defaultPrice}</strong>{' '}
                  on or before the 5th day of every calendar month.
                </li>
                <li>
                  <strong>Security Deposit:</strong> The Second Party has deposited a security deposit sum of{' '}
                  <strong>₹{printingAgreement.roomAllocation.rentOverride ? printingAgreement.roomAllocation.rentOverride * 2 : 12000}</strong>{' '}
                  with the First Party, which will be refunded at checkout subject to clearance checks.
                </li>
                <li>
                  <strong>Lock-in Period:</strong> The agreement holds a lock-in period of{' '}
                  <strong>{printingAgreement.lockInMonths} months</strong>. Early termination triggers deposit deduction.
                </li>
                <li>
                  <strong>Notice Period:</strong> Either party can terminate this stay by providing a{' '}
                  <strong>{printingAgreement.noticePeriodDays} days notice</strong> in writing.
                </li>
                <li>
                  <strong>Electricity & Water:</strong> Utility charges are set: Electricity -{' '}
                  {printingAgreement.electricityCharges}; Water - {printingAgreement.waterCharges}; Maintenance -{' '}
                  {printingAgreement.maintenanceCharges}.
                </li>
                <li>
                  <strong>PG House Policies:</strong> The tenant agrees to comply with the rules: {printingAgreement.rulesText}.
                </li>
              </ol>
            </div>

            {/* Signature blocks & QR verification */}
            <div className="grid grid-cols-3 gap-6 pt-10 items-end text-xs">
              <div className="text-center space-y-2.5">
                <img
                  src={printingAgreement.ownerSignatureUrl}
                  alt="Landlord signature"
                  className="w-16 h-12 object-contain mx-auto"
                />
                <div className="border-t border-zinc-400 pt-1 font-bold">
                  Owner Signature
                </div>
              </div>

              <div className="text-center space-y-2">
                <img
                  src={printingAgreement.qrCodeUrl}
                  alt="QR Verification"
                  className="w-20 h-20 object-contain mx-auto border"
                />
                <div className="pt-1 text-[10px] text-zinc-500 font-bold">
                  Scan to Verify Lease Validity
                </div>
              </div>

              <div className="text-center space-y-2.5">
                <img
                  src={printingAgreement.tenantSignatureUrl}
                  alt="Tenant signature"
                  className="w-16 h-12 object-contain mx-auto"
                />
                <div className="border-t border-zinc-400 pt-1 font-bold">
                  Tenant Signature
                </div>
              </div>
            </div>

            {/* Expiry footer notice */}
            <div className="pt-10 border-t border-zinc-100 text-[10px] text-center text-zinc-400 font-bold">
              Generated via PG Nexus AI Platform. Document download window closes 48 hours after timestamp:{' '}
              {new Date(printingAgreement.createdAt).toLocaleString()}.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
