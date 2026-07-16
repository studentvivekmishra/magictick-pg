'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  UserCheck,
  FileText,
  Calendar,
  AlertOctagon,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Clock,
  Briefcase,
  Smartphone,
  MapPin,
  Trash2,
  X,
  CreditCard,
  Sparkles,
  Upload,
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  date: string;
  type: 'CHECKIN' | 'CHECKOUT' | 'PAYMENT' | 'DEPOSIT' | 'AGREEMENT' | 'COMPLAINT' | 'VISITOR';
  title: string;
  description: string;
}

interface Document {
  id: string;
  type: string;
  fileUrl: string;
  verifiedStatus: string;
}

interface Allocation {
  id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  checkInDate: string;
  agreementStartDate: string;
  agreementEndDate: string;
  rentOverride: number | null;
  room: {
    id: string;
    roomNumber: string;
    floor: number;
    defaultPrice: number;
  };
  bed: {
    id: string;
    bedNumber: string;
  };
  deposit?: {
    id: string;
    amount: number;
    paidAmount: number;
    pendingAmount: number;
    refundAmount: number | null;
    refundStatus: string;
    deductionReason: string | null;
  };
}

interface Customer {
  id: string;
  name: string;
  fatherName: string;
  motherName: string;
  phone: string;
  altPhone: string | null;
  email: string;
  gender: string;
  dob: string;
  occupation: string;
  companyName: string | null;
  emergencyContactName: string;
  emergencyContactPhone: string;
  permanentAddress: string;
  currentAddress: string;
  city: string;
  state: string;
  pincode: string;
  nationality: string;
  bloodGroup: string | null;
  photoUrl: string | null;
  allocations: Allocation[];
  documents: Document[];
  timeline: TimelineEvent[];
}

interface UserSession {
  userId: string;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST';
}

interface RoomOption {
  id: string;
  roomNumber: string;
  defaultPrice: number;
  beds: Array<{ id: string; bedNumber: string; isOccupied: boolean }>;
}

export default function CustomersPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE'); // ACTIVE, COMPLETED, ALL
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);

  // Room selections for wizard
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isDocOpen, setIsDocOpen] = useState(false);

  // Add customer form fields
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAltPhone, setNewAltPhone] = useState('');
  const [newGender, setNewGender] = useState('Male');
  const [newDOB, setNewDOB] = useState('');
  const [newFatherName, setNewFatherName] = useState('');
  const [newMotherName, setNewMotherName] = useState('');
  const [newOccupation, setNewOccupation] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newEmergencyPhone, setNewEmergencyPhone] = useState('');
  const [newPermAddress, setNewPermAddress] = useState('');
  const [newCurrAddress, setNewCurrAddress] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [newNationality, setNewNationality] = useState('Indian');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [createTenantLogin, setCreateTenantLogin] = useState(false);
  const [tenantPassword, setTenantPassword] = useState('');

  // Allocation wizard inputs
  const [newCheckinDate, setNewCheckinDate] = useState('');
  const [newLeaseStart, setNewLeaseStart] = useState('');
  const [newLeaseEnd, setNewLeaseEnd] = useState('');
  const [newRentOverride, setNewRentOverride] = useState('');
  const [newDepositAmount, setNewDepositAmount] = useState('');

  // Checkout inputs
  const [refundAmount, setRefundAmount] = useState('');
  const [deductionReason, setDeductionReason] = useState('');

  // Doc attachment inputs
  const [newDocType, setNewDocType] = useState('AADHAR_FRONT');
  const [newDocUrl, setNewDocUrl] = useState('');

  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      const resSession = await fetch('/api/auth');
      const sessionData = await resSession.json();
      if (sessionData.authenticated) {
        setSession(sessionData.user);
      }

      // Fetch customers
      const resCust = await fetch(`/api/customers?status=${statusFilter}&search=${search}`);
      const custData = await resCust.json();
      setCustomers(custData);
      
      // If customer is selected, keep it updated
      if (selectedCust) {
        const updated = custData.find((c: Customer) => c.id === selectedCust.id);
        if (updated) setSelectedCust(updated);
      } else if (custData.length > 0) {
        setSelectedCust(custData[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadRoomOptions = async () => {
    try {
      const resRooms = await fetch('/api/rooms');
      const roomsData = await resRooms.json();
      // Filter for rooms that have at least one vacant bed
      const options = roomsData.map((r: any) => ({
        id: r.id,
        roomNumber: r.roomNumber,
        defaultPrice: r.defaultPrice,
        beds: r.beds,
      }));
      setRoomOptions(options);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, search]);

  useEffect(() => {
    if (isAddOpen) {
      loadRoomOptions();
    }
  }, [isAddOpen]);

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);

    if (!newName || !newEmail || !newPhone || !newDOB || !selectedRoomId || !selectedBedId || !newCheckinDate || !newLeaseStart || !newLeaseEnd) {
      setFormError('Please fill in all required fields (basic details, room/bed, dates)');
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone,
          altPhone: newAltPhone || null,
          gender: newGender,
          dob: newDOB,
          fatherName: newFatherName,
          motherName: newMotherName,
          occupation: newOccupation,
          companyName: newCompanyName || null,
          emergencyContactName: newEmergencyName,
          emergencyContactPhone: newEmergencyPhone,
          permanentAddress: newPermAddress,
          currentAddress: newCurrAddress,
          pincode: newPincode,
          nationality: newNationality,
          bloodGroup: newBloodGroup,
          photoUrl: newPhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150',
          roomId: selectedRoomId,
          bedId: selectedBedId,
          checkInDate: newCheckinDate,
          agreementStartDate: newLeaseStart,
          agreementEndDate: newLeaseEnd,
          rentOverride: newRentOverride || null,
          depositAmount: newDepositAmount || '0',
          createTenantLogin,
          tenantPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsAddOpen(false);
        // Reset form fields
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        setNewAltPhone('');
        setNewDOB('');
        setNewFatherName('');
        setNewMotherName('');
        setNewOccupation('');
        setNewCompanyName('');
        setNewEmergencyName('');
        setNewEmergencyPhone('');
        setNewPermAddress('');
        setNewCurrAddress('');
        setNewPincode('');
        setCreateTenantLogin(false);
        setTenantPassword('');
        setNewPhotoUrl('');
        setSelectedRoomId('');
        setSelectedBedId('');
        setNewCheckinDate('');
        setNewLeaseStart('');
        setNewLeaseEnd('');
        setNewRentOverride('');
        setNewDepositAmount('');
        loadData();
      } else {
        setFormError(data.error || 'Failed to onboard guest');
      }
    } catch (err) {
      setFormError('Failed to execute database transactions.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    if (!selectedCust) return;
    const activeAlloc = selectedCust.allocations.find((a) => a.status === 'ACTIVE');
    if (!activeAlloc) return;

    try {
      const res = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocationId: activeAlloc.id,
          checkoutAction: true,
          refundAmount: refundAmount || '0',
          deductionReason: deductionReason || '',
        }),
      });

      if (res.ok) {
        setIsCheckoutOpen(false);
        setRefundAmount('');
        setDeductionReason('');
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Checkout process failed');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAttachDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    if (!selectedCust || !newDocUrl) return;

    try {
      const res = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCust.id,
          documentUpload: true,
          documentType: newDocType,
          fileUrl: newDocUrl,
        }),
      });

      if (res.ok) {
        setIsDocOpen(false);
        setNewDocUrl('');
        loadData();
      } else {
        alert('Failed to attach document');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this guest profile? This is permanent.')) return;
    try {
      const res = await fetch(`/api/customers?customerId=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedCust(null);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete guest profile');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Users className="w-8 h-8 animate-bounce text-indigo-500" />
        <p className="text-sm font-semibold text-muted-foreground">Loading guests directories...</p>
      </div>
    );
  }

  const activeAllocation = selectedCust?.allocations.find((a) => a.status === 'ACTIVE');
  const isOwner = session.role === 'OWNER';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Customers Registry</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage onboarding wizard, KYC document files, checked-out records, and tenant event history.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Onboard Guest
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid md:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Guests List */}
        <div className="md:col-span-4 bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
          
          {/* List Search & filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name/phone/email..."
                className="w-full bg-background border border-border rounded-xl py-2 pl-9 pr-4 text-xs text-foreground focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex gap-1 bg-muted/60 p-1 rounded-xl text-[10px] font-bold text-center">
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'ACTIVE' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Active stays
              </button>
              <button
                onClick={() => setStatusFilter('COMPLETED')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'COMPLETED' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Checked-out
              </button>
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'ALL' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* List display */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {customers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-10 font-semibold">
                No guest records found.
              </p>
            ) : (
              customers.map((cust) => {
                const activeStay = cust.allocations.find((a) => a.status === 'ACTIVE');
                const isSelected = selectedCust?.id === cust.id;

                return (
                  <button
                    key={cust.id}
                    onClick={() => setSelectedCust(cust)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-950 dark:text-indigo-300 translate-x-0.5'
                        : 'bg-background/20 border-border/80 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-border shadow-sm shrink-0 bg-zinc-200">
                        <img
                          src={cust.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=80'}
                          alt={cust.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate text-foreground">{cust.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{cust.phone}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 font-semibold shrink-0">
                      {activeStay ? (
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full uppercase">
                          Room {activeStay.room.roomNumber}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-muted-foreground px-2 py-0.5 rounded-full uppercase">
                          Left
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Detailed Customer Profiles */}
        <div className="md:col-span-8 space-y-6">
          {selectedCust ? (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Header profile badge */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500 shadow-md bg-zinc-200 shrink-0">
                    <img
                      src={selectedCust.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150'}
                      alt={selectedCust.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-foreground">{selectedCust.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      {selectedCust.occupation} {selectedCust.companyName ? `@ ${selectedCust.companyName}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {activeAllocation ? (
                    <button
                      onClick={() => setIsCheckoutOpen(true)}
                      className="flex items-center gap-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-md shadow-rose-500/10 active:scale-95 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Checkout Guest
                    </button>
                  ) : (
                    isOwner && (
                      <button
                        onClick={() => handleDeleteCustomer(selectedCust.id)}
                        className="flex items-center gap-1 border border-rose-500/20 text-rose-500 hover:bg-rose-500/5 font-bold py-2 px-3 rounded-xl text-xs active:scale-95 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Record
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Grid: Basic Info Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                
                {/* Details col A */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-1.5">
                    Basic Info
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-semibold">Email:</span>
                      <span className="font-bold text-foreground truncate max-w-[200px]">{selectedCust.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-semibold">Father's Name:</span>
                      <span className="font-bold text-foreground">{selectedCust.fatherName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-semibold">Mother's Name:</span>
                      <span className="font-bold text-foreground">{selectedCust.motherName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-semibold">Date of Birth:</span>
                      <span className="font-bold text-foreground">
                        {new Date(selectedCust.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-semibold">Emergency Contact:</span>
                      <span className="font-bold text-foreground">{selectedCust.emergencyContactName} ({selectedCust.emergencyContactPhone})</span>
                    </div>
                  </div>
                </div>

                {/* Details col B */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-1.5">
                    Additional Details
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-semibold">Gender:</span>
                      <span className="font-bold text-foreground">{selectedCust.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-semibold">Blood Group:</span>
                      <span className="font-bold text-foreground">{selectedCust.bloodGroup || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-semibold">Nationality:</span>
                      <span className="font-bold text-foreground">{selectedCust.nationality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-semibold">Permanent Address:</span>
                      <span className="font-bold text-foreground text-right truncate max-w-[180px]">{selectedCust.permanentAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-semibold">Current Address:</span>
                      <span className="font-bold text-foreground text-right truncate max-w-[180px]">{selectedCust.currentAddress}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Security deposit & allocations card */}
              {selectedCust.allocations.map((alloc) => (
                <div key={alloc.id} className="bg-muted/30 border border-border p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-border/60">
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Stay Details ({alloc.status})
                    </span>
                    <span className="text-xs font-extrabold text-foreground">
                      Room {alloc.room.roomNumber} (Floor {alloc.room.floor}) • Bed {alloc.bed.bedNumber.split('-')[1]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                    <div>
                      <span className="text-muted-foreground block">Check-in Date</span>
                      <span className="text-foreground font-bold text-sm mt-0.5 inline-block">
                        {new Date(alloc.checkInDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Rent Amount</span>
                      <span className="text-foreground font-bold text-sm mt-0.5 inline-block">
                        ₹{alloc.rentOverride || alloc.room.defaultPrice}/mo
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Deposit amount</span>
                      <span className="text-foreground font-bold text-sm mt-0.5 inline-block">
                        ₹{alloc.deposit?.amount || '0'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Deposit Status</span>
                      <span className="text-foreground font-bold text-sm mt-0.5 inline-block uppercase text-indigo-500">
                        {alloc.deposit?.refundStatus || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {alloc.deposit?.refundStatus === 'DEDUCTED' && (
                    <div className="text-xs bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl font-bold flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4" />
                      <span>Deducted at Checkout: {alloc.deposit.deductionReason} (Refunded: ₹{alloc.deposit.refundAmount})</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Split sections: Documents vs Timeline */}
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                
                {/* Documents section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      KYC Documents ({selectedCust.documents.length})
                    </h4>
                    <button
                      onClick={() => setIsDocOpen(true)}
                      className="text-[10px] font-bold text-indigo-500 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Upload File
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                    {selectedCust.documents.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-semibold py-4">No verified documents uploaded.</p>
                    ) : (
                      selectedCust.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-background/50 hover:bg-muted/40 transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold uppercase text-foreground">{doc.type.replace('_', ' ')}</p>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-indigo-500 font-bold hover:underline"
                            >
                              View Attachment
                            </a>
                          </div>
                          <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                            {doc.verifiedStatus}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Timeline section */}
                <div className="space-y-4">
                  <div className="pb-2 border-b border-border">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      Activity Timeline
                    </h4>
                  </div>

                  <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                    {selectedCust.timeline && selectedCust.timeline.length > 0 ? (
                      selectedCust.timeline.map((ev) => {
                        let dotColor = 'bg-indigo-500 glow-primary';
                        if (ev.type === 'CHECKOUT') dotColor = 'bg-rose-500 glow-danger';
                        if (ev.type === 'PAYMENT') dotColor = 'bg-emerald-500 glow-success';
                        if (ev.type === 'COMPLAINT') dotColor = 'bg-amber-500 glow-warning';

                        return (
                          <div key={ev.id} className="relative pl-6 pb-2 border-l-2 border-border/60 last:border-l-0">
                            <span className={`absolute -left-1.5 top-1.5 w-3.5 h-3.5 rounded-full ${dotColor}`} />
                            <div className="text-xs">
                              <span className="text-[10px] text-muted-foreground font-bold">
                                {new Date(ev.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' })}
                              </span>
                              <h5 className="font-bold text-foreground mt-0.5">{ev.title}</h5>
                              <p className="text-muted-foreground text-[10px] mt-0.5 font-semibold leading-relaxed">
                                {ev.description}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground font-semibold py-4">No chronological events logged.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-16 shadow-sm text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">Select a guest from the left sidebar to inspect details.</p>
            </div>
          )}
        </div>

      </div>

      {/* Modal: Onboard / Check-In Wizard */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slide-up">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20 sticky top-0 bg-card z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse-subtle" />
                <h3 className="text-base font-extrabold">Guest Onboarding Wizard</h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOnboard} className="p-6 space-y-6">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2 px-3 rounded-xl font-medium">
                  {formError}
                </div>
              )}

              {/* Step 1: Personal Profile */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest border-b border-border/60 pb-1">
                  1. Tenant Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="john.doe@example.com"
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">DOB *</label>
                    <input
                      type="date"
                      required
                      value={newDOB}
                      onChange={(e) => setNewDOB(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gender</label>
                    <select
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground font-semibold"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Occupation</label>
                    <input
                      type="text"
                      value={newOccupation}
                      onChange={(e) => setNewOccupation(e.target.value)}
                      placeholder="e.g. Student / Employee"
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Blood Group</label>
                    <select
                      value={newBloodGroup}
                      onChange={(e) => setNewBloodGroup(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground font-semibold"
                    >
                      <option value="A+">A+</option>
                      <option value="B+">B+</option>
                      <option value="O+">O+</option>
                      <option value="AB+">AB+</option>
                      <option value="A-">A-</option>
                      <option value="B-">B-</option>
                      <option value="O-">O-</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Father's Name</label>
                    <input
                      type="text"
                      value={newFatherName}
                      onChange={(e) => setNewFatherName(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mother's Name</label>
                    <input
                      type="text"
                      value={newMotherName}
                      onChange={(e) => setNewMotherName(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Emergency Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={newEmergencyName}
                      onChange={(e) => setNewEmergencyName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar (Father)"
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Emergency Phone *</label>
                    <input
                      type="tel"
                      required
                      value={newEmergencyPhone}
                      onChange={(e) => setNewEmergencyPhone(e.target.value)}
                      placeholder="e.g. 9876543211"
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Permanent Address</label>
                    <textarea
                      value={newPermAddress}
                      onChange={(e) => setNewPermAddress(e.target.value)}
                      rows={2}
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Address</label>
                    <textarea
                      value={newCurrAddress}
                      onChange={(e) => setNewCurrAddress(e.target.value)}
                      rows={2}
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pincode</label>
                    <input
                      type="text"
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nationality</label>
                    <input
                      type="text"
                      value={newNationality}
                      onChange={(e) => setNewNationality(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Photo URL</label>
                    <input
                      type="text"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                </div>

                {/* Tenant Login Account Creation options */}
                <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl space-y-3 mt-4 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="createTenantLogin"
                      checked={createTenantLogin}
                      onChange={(e) => setCreateTenantLogin(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <label htmlFor="createTenantLogin" className="text-xs font-bold text-indigo-950 uppercase tracking-wider cursor-pointer">
                      Provision Tenant Login Account ID & Password
                    </label>
                  </div>
                  {createTenantLogin && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Login Email (Uses field above)</label>
                        <input
                          type="text"
                          disabled
                          value={newEmail}
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tenant password *</label>
                        <input
                          type="password"
                          required={createTenantLogin}
                          value={tenantPassword}
                          onChange={(e) => setTenantPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Room & Bed Allocation */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest border-b border-border/60 pb-1">
                  2. Room Booking & Deposit details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Room *</label>
                    <select
                      value={selectedRoomId}
                      required
                      onChange={(e) => {
                        setSelectedRoomId(e.target.value);
                        setSelectedBedId('');
                      }}
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground font-semibold"
                    >
                      <option value="">-- Select Room --</option>
                      {roomOptions.map((r) => {
                        const vacantBeds = r.beds.filter((b) => !b.isOccupied).length;
                        return (
                          <option key={r.id} value={r.id}>
                            Room {r.roomNumber} (₹{r.defaultPrice}/mo, {vacantBeds} beds vacant)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {selectedRoomId && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Bed *</label>
                      <select
                        value={selectedBedId}
                        required
                        onChange={(e) => setSelectedBedId(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground font-semibold"
                      >
                        <option value="">-- Select Bed --</option>
                        {roomOptions
                          .find((r) => r.id === selectedRoomId)
                          ?.beds.filter((b) => !b.isOccupied)
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              Bed {b.bedNumber.split('-')[1]}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Check-in Date *</label>
                    <input
                      type="date"
                      required
                      value={newCheckinDate}
                      onChange={(e) => {
                        setNewCheckinDate(e.target.value);
                        setNewLeaseStart(e.target.value);
                      }}
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Agreement Start *</label>
                    <input
                      type="date"
                      required
                      value={newLeaseStart}
                      onChange={(e) => setNewLeaseStart(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Agreement End *</label>
                    <input
                      type="date"
                      required
                      value={newLeaseEnd}
                      onChange={(e) => setNewLeaseEnd(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Monthly Rent Override (Optional)</label>
                    <input
                      type="number"
                      value={newRentOverride}
                      onChange={(e) => setNewRentOverride(e.target.value)}
                      placeholder="Leave empty for room default"
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Security Deposit Amount</label>
                    <input
                      type="number"
                      value={newDepositAmount}
                      onChange={(e) => setNewDepositAmount(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                    />
                  </div>
                </div>
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
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Onboarding...' : 'Complete Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Checkout Portal */}
      {isCheckoutOpen && selectedCust && activeAllocation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-slide-up">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-extrabold">Checkout: {selectedCust.name}</h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckout} className="p-6 space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3 rounded-xl text-xs font-semibold">
                This will vacate Room {activeAllocation.room.roomNumber} Bed {activeAllocation.bed.bedNumber.split('-')[1]} immediately.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Original Security Deposit</label>
                <div className="text-base font-extrabold text-foreground bg-muted/50 p-2.5 rounded-xl border">
                  ₹{activeAllocation.deposit?.amount || '0'}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Refund Amount Paid</label>
                <input
                  type="number"
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="e.g. 7000"
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Reason for Deductions (If Any)</label>
                <textarea
                  value={deductionReason}
                  onChange={(e) => setDeductionReason(e.target.value)}
                  placeholder="e.g. Damage to wall paint (₹1000)"
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="py-2 px-4 rounded-xl border border-border text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs disabled:opacity-50 animate-pulse-subtle"
                >
                  {actionLoading ? 'Checking out...' : 'Apply Checkout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Document */}
      {isDocOpen && selectedCust && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-slide-up">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-extrabold">Attach KYC Document</h3>
              </div>
              <button
                onClick={() => setIsDocOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAttachDoc} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Document Type</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground font-semibold"
                >
                  <option value="AADHAR_FRONT">Aadhar Front</option>
                  <option value="AADHAR_BACK">Aadhar Back</option>
                  <option value="PAN">PAN Card</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="EMPLOYEE_ID">Employee ID</option>
                  <option value="STUDENT_ID">Student ID</option>
                  <option value="POLICE_VERIFICATION">Police Verification PDF</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">File URL (Mock Upload Link)</label>
                <input
                  type="text"
                  required
                  value={newDocUrl}
                  onChange={(e) => setNewDocUrl(e.target.value)}
                  placeholder="https://example.com/aadhar.jpg"
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDocOpen(false)}
                  className="py-2 px-4 rounded-xl border border-border text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Uploading...' : 'Attach File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
