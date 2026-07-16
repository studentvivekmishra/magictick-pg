'use client';

import React, { useState, useEffect } from 'react';
import {
  Home,
  Plus,
  Trash2,
  Sliders,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Sparkles,
  Info,
  Layers,
  X,
  Search,
} from 'lucide-react';

interface Bed {
  id: string;
  bedNumber: string;
  isOccupied: boolean;
}

interface Allocation {
  id: string;
  rentOverride: number | null;
  customer: {
    name: string;
    phone: string;
  };
}

interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  type: 'SINGLE' | 'DOUBLE' | 'TRIPLE';
  status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING' | 'RESERVED';
  defaultPrice: number;
  amenities: string[];
  images: string[];
  beds: Bed[];
  allocations: Allocation[];
}

interface UserSession {
  userId: string;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST';
}

export default function RoomsPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [floorFilter, setFloorFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Add room form fields
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newFloor, setNewFloor] = useState('1');
  const [newType, setNewType] = useState('SINGLE');
  const [newPrice, setNewPrice] = useState('');
  const [newAmenities, setNewAmenities] = useState<string[]>([]);
  
  // Override fields
  const [editDefaultPrice, setEditDefaultPrice] = useState('');
  const [editOverridePrice, setEditOverridePrice] = useState('');
  const [selectedAllocationId, setSelectedAllocationId] = useState('');

  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const amenitiesList = ['WiFi', 'AC', 'Cooler', 'Attached Bathroom', 'Balcony', 'Wardrobe', 'Table', 'Chair', 'Fan'];

  const loadSessionAndRooms = async () => {
    try {
      const resSession = await fetch('/api/auth');
      const sessionData = await resSession.json();
      if (sessionData.authenticated) {
        setSession(sessionData.user);
      }

      const resRooms = await fetch('/api/rooms');
      const roomsData = await resRooms.json();
      setRooms(roomsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessionAndRooms();
  }, []);

  const handleAmenityCheck = (amenity: string) => {
    if (newAmenities.includes(amenity)) {
      setNewAmenities(newAmenities.filter((a) => a !== amenity));
    } else {
      setNewAmenities([...newAmenities, amenity]);
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);

    if (!newRoomNumber || !newFloor || !newPrice) {
      setFormError('Please fill in all fields');
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: newRoomNumber,
          floor: newFloor,
          type: newType,
          defaultPrice: newPrice,
          amenities: newAmenities,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsAddOpen(false);
        setNewRoomNumber('');
        setNewPrice('');
        setNewAmenities([]);
        loadSessionAndRooms();
      } else {
        setFormError(data.error || 'Failed to create room');
      }
    } catch (err) {
      setFormError('Connection failure.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (roomId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, status: newStatus }),
      });
      if (res.ok) {
        loadSessionAndRooms();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update status');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePricingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);

    if (!selectedRoom) return;

    try {
      // If default price has changed
      if (editDefaultPrice && parseFloat(editDefaultPrice) !== selectedRoom.defaultPrice) {
        const res = await fetch('/api/rooms', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: selectedRoom.id, defaultPrice: editDefaultPrice }),
        });
        if (!res.ok) {
          const err = await res.json();
          setFormError(err.error || 'Failed to update default price');
          setActionLoading(false);
          return;
        }
      }

      // If active guest pricing override is executed
      if (selectedAllocationId && editOverridePrice) {
        const res = await fetch('/api/rooms', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: selectedRoom.id,
            overrideAllocationId: selectedAllocationId,
            rentOverrideValue: editOverridePrice,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          setFormError(err.error || 'Failed to override rent');
          setActionLoading(false);
          return;
        }
      }

      setIsPricingOpen(false);
      setSelectedRoom(null);
      setEditDefaultPrice('');
      setEditOverridePrice('');
      setSelectedAllocationId('');
      loadSessionAndRooms();
    } catch (err) {
      setFormError('Failed to save changes.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room? This action is permanent.')) return;
    try {
      const res = await fetch(`/api/rooms?roomId=${roomId}`, { method: 'DELETE' });
      if (res.ok) {
        loadSessionAndRooms();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete room');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter calculations
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(search.toLowerCase());
    const matchesFloor = floorFilter === 'ALL' || room.floor.toString() === floorFilter;
    const matchesType = typeFilter === 'ALL' || room.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || room.status === statusFilter;
    return matchesSearch && matchesFloor && matchesType && matchesStatus;
  });

  if (loading || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Home className="w-8 h-8 animate-bounce text-indigo-500" />
        <p className="text-sm font-semibold text-muted-foreground">Loading room status directories...</p>
      </div>
    );
  }

  const isOwner = session.role === 'OWNER';
  const isManager = session.role === 'MANAGER';
  const canEdit = isOwner || isManager;

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Rooms & Beds Registry</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of floors, bed occupancies, pricing overrides, and maintenance rosters.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Room
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="relative col-span-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room..."
            className="w-full bg-background border border-border rounded-xl py-2 pl-9 pr-4 text-xs text-foreground focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Floor Filter */}
        <select
          value={floorFilter}
          onChange={(e) => setFloorFilter(e.target.value)}
          className="bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:border-indigo-500 transition-colors font-semibold"
        >
          <option value="ALL">All Floors</option>
          <option value="1">1st Floor</option>
          <option value="2">2nd Floor</option>
          <option value="3">3rd Floor</option>
        </select>

        {/* Room Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:border-indigo-500 transition-colors font-semibold"
        >
          <option value="ALL">All Sharing Types</option>
          <option value="SINGLE">Single Sharing</option>
          <option value="DOUBLE">Double Sharing</option>
          <option value="TRIPLE">Triple Sharing</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:border-indigo-500 transition-colors font-semibold"
        >
          <option value="ALL">All Room Statuses</option>
          <option value="VACANT">Vacant</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="CLEANING">Cleaning</option>
          <option value="RESERVED">Reserved</option>
        </select>
      </div>

      {/* Rooms Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => {
          const occupiedCount = room.beds.filter((b) => b.isOccupied).length;
          const totalBeds = room.beds.length;
          
          let statusColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25';
          if (room.status === 'OCCUPIED') statusColor = 'bg-indigo-500/10 text-indigo-500 border-indigo-500/25';
          if (room.status === 'MAINTENANCE') statusColor = 'bg-rose-500/10 text-rose-500 border-rose-500/25';
          if (room.status === 'CLEANING') statusColor = 'bg-amber-500/10 text-amber-500 border-amber-500/25';

          return (
            <div
              key={room.id}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 relative"
            >
              {/* Top Banner details */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-extrabold text-foreground">Room {room.roomNumber}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Layers className="w-3.5 h-3.5" />
                      Floor {room.floor} • {room.type} Sharing
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${statusColor}`}>
                    {room.status}
                  </span>
                </div>

                {/* Bed list visualization */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Beds Capacity ({occupiedCount}/{totalBeds})</span>
                  <div className="flex gap-2">
                    {room.beds.map((bed) => (
                      <div
                        key={bed.id}
                        className={`flex-1 p-2 rounded-xl text-center border text-xs font-semibold ${
                          bed.isOccupied
                            ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                            : 'bg-zinc-100 dark:bg-zinc-800/80 border-border text-muted-foreground'
                        }`}
                      >
                        {bed.bedNumber.split('-')[1]}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Tenants summary */}
                {room.allocations.length > 0 && (
                  <div className="bg-muted/40 border border-border p-3 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Guests</span>
                    {room.allocations.map((alloc) => (
                      <div key={alloc.id} className="flex justify-between items-center text-xs font-semibold">
                        <span>{alloc.customer.name}</span>
                        <span className="text-muted-foreground">
                          {alloc.rentOverride ? `₹${alloc.rentOverride} overridden` : 'Default Rent'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Amenities pills */}
                <div className="flex flex-wrap gap-1.5">
                  {room.amenities.slice(0, 4).map((amenity) => (
                    <span
                      key={amenity}
                      className="text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 border border-border/80 text-muted-foreground px-2 py-0.5 rounded"
                    >
                      {amenity}
                    </span>
                  ))}
                  {room.amenities.length > 4 && (
                    <span className="text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 border border-border/80 text-muted-foreground px-2 py-0.5 rounded">
                      +{room.amenities.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="px-5 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-foreground">
                  ₹{room.defaultPrice}<span className="text-[10px] text-muted-foreground font-medium">/mo</span>
                </span>

                <div className="flex gap-1.5">
                  {/* Status update select toggle */}
                  <select
                    value={room.status}
                    onChange={(e) => handleStatusChange(room.id, e.target.value)}
                    className="bg-card border border-border rounded-lg px-2 py-1 text-[10px] font-bold focus:ring-0 focus:outline-none cursor-pointer"
                  >
                    <option value="VACANT">Vacant</option>
                    <option value="CLEANING">Cleaning</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="RESERVED">Reserved</option>
                  </select>

                  {/* Edit Pricing Trigger */}
                  {isOwner && (
                    <button
                      onClick={() => {
                        setSelectedRoom(room);
                        setEditDefaultPrice(room.defaultPrice.toString());
                        setIsPricingOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                      title="Adjust Pricing overrides"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete Room */}
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      disabled={occupiedCount > 0}
                      className="p-1.5 rounded-lg border border-rose-500/10 hover:bg-rose-500/10 text-rose-500 transition-all disabled:opacity-30"
                      title={occupiedCount > 0 ? "Cannot delete room with occupied beds" : "Delete Room"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Room */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-slide-up">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-extrabold">Add New PG Room</h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2 px-3 rounded-xl font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Room Number</label>
                  <input
                    type="text"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    placeholder="e.g. 101"
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Floor</label>
                  <select
                    value={newFloor}
                    onChange={(e) => setNewFloor(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground font-semibold"
                  >
                    <option value="1">1st Floor</option>
                    <option value="2">2nd Floor</option>
                    <option value="3">3rd Floor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sharing Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground font-semibold"
                  >
                    <option value="SINGLE">Single Sharing (1 Bed)</option>
                    <option value="DOUBLE">Double Sharing (2 Beds)</option>
                    <option value="TRIPLE">Triple Sharing (3 Beds)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rent Price (Default)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. 8000"
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                  />
                </div>
              </div>

              {/* Amenities checklist */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Amenities</label>
                <div className="grid grid-cols-3 gap-2">
                  {amenitiesList.map((amenity) => {
                    const isChecked = newAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => handleAmenityCheck(amenity)}
                        className={`py-1.5 px-2.5 rounded-xl border text-[10px] font-bold text-center transition-all ${
                          isChecked
                            ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                            : 'bg-background border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {amenity}
                      </button>
                    );
                  })}
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
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Pricing & Override */}
      {isPricingOpen && selectedRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-slide-up">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-extrabold">Adjust Pricing: Room {selectedRoom.roomNumber}</h3>
              </div>
              <button
                onClick={() => {
                  setIsPricingOpen(false);
                  setSelectedRoom(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePricingSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2 px-3 rounded-xl font-medium">
                  {formError}
                </div>
              )}

              {/* Edit default price */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Default Room Price</label>
                <input
                  type="number"
                  value={editDefaultPrice}
                  onChange={(e) => setEditDefaultPrice(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                />
                <span className="text-[10px] text-muted-foreground">This updates the base billing fee for future allocations.</span>
              </div>

              {/* Guest Override selection */}
              {selectedRoom.allocations.length > 0 && (
                <div className="pt-2 border-t border-border space-y-3">
                  <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block">Active Guest Rent Override</span>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Select Active Tenant</label>
                    <select
                      value={selectedAllocationId}
                      onChange={(e) => {
                        setSelectedAllocationId(e.target.value);
                        const a = selectedRoom.allocations.find((al) => al.id === e.target.value);
                        setEditOverridePrice(a?.rentOverride?.toString() || selectedRoom.defaultPrice.toString());
                      }}
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground font-semibold"
                    >
                      <option value="">-- Select Tenant to Override --</option>
                      {selectedRoom.allocations.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.customer.name} (Current: ₹{a.rentOverride || selectedRoom.defaultPrice})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedAllocationId && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Override Price for this Stay</label>
                      <input
                        type="number"
                        value={editOverridePrice}
                        onChange={(e) => setEditOverridePrice(e.target.value)}
                        placeholder="e.g. 7500"
                        className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPricingOpen(false);
                    setSelectedRoom(null);
                  }}
                  className="py-2 px-4 rounded-xl border border-border text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Apply Pricing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
