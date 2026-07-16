'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Sparkles, Building, KeyRound, Mail, RefreshCw, CheckCircle, Info } from 'lucide-react';

interface SystemSettings {
  id: string;
  pgName: string;
  pgLogoUrl: string;
  pgAddress: string;
  singleSharingPrice: number;
  doubleSharingPrice: number;
  tripleSharingPrice: number;
  defaultDeposit: number;
  rentDueDateDay: number;
  lateFeeDaysGrace: number;
  lateFeeFlatRate: number;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  currencySymbol: string;
  dateFormat: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form Fields
  const [pgName, setPgName] = useState('');
  const [pgAddress, setPgAddress] = useState('');
  const [singlePrice, setSinglePrice] = useState('');
  const [doublePrice, setDoublePrice] = useState('');
  const [triplePrice, setTriplePrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [graceDays, setGraceDays] = useState('');
  const [lateFee, setLateFee] = useState('');

  // SMTP Settings
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');

  // Settlement & WiFi Settings
  const [upiId, setUpiId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [wifiName, setWifiName] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
      
      setPgName(data.pgName);
      setPgAddress(data.pgAddress);
      setSinglePrice(data.singleSharingPrice.toString());
      setDoublePrice(data.doubleSharingPrice.toString());
      setTriplePrice(data.tripleSharingPrice.toString());
      setDeposit(data.defaultDeposit.toString());
      setDueDate(data.rentDueDateDay.toString());
      setGraceDays(data.lateFeeDaysGrace.toString());
      setLateFee(data.lateFeeFlatRate.toString());
      setSmtpHost(data.smtpHost);
      setSmtpPort(data.smtpPort.toString());
      setSmtpUser(data.smtpUser);
      setSmtpPass(data.smtpPass);
      setUpiId(data.upiId || '');
      setQrCodeUrl(data.qrCodeUrl || '');
      setWifiName(data.wifiName || '');
      setWifiPassword(data.wifiPassword || '');
      setBankAccountName(data.bankAccountName || '');
      setBankAccountNumber(data.bankAccountNumber || '');
      setBankIfscCode(data.bankIfscCode || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pgName,
          pgAddress,
          singleSharingPrice: singlePrice,
          doubleSharingPrice: doublePrice,
          tripleSharingPrice: triplePrice,
          defaultDeposit: deposit,
          rentDueDateDay: dueDate,
          lateFeeDaysGrace: graceDays,
          lateFeeFlatRate: lateFee,
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPass,
          upiId,
          qrCodeUrl,
          wifiName,
          wifiPassword,
          bankAccountName,
          bankAccountNumber,
          bankIfscCode,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        loadSettings();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert('Failed to save settings configurations');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Settings className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-muted-foreground">Retrieving configuration settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">System Configurations</h2>
        <p className="text-sm text-slate-500 mt-1">
          Customize pricing structures, PG branding info, SMTP email accounts, and late fee guidelines.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs font-semibold">
        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl flex items-center gap-2 font-bold">
            <CheckCircle className="w-5 h-5" />
            <span>Configurations saved successfully! Rooms and billing modules updated.</span>
          </div>
        )}

        {/* Column splits */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          
          {/* Col 1: PG Details & Pricing */}
          <div className="space-y-6">
            
            {/* PG Info */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-blue-600 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                <Building className="w-4 h-4" />
                PG Brand Information
              </h3>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">PG Name</label>
                <input
                  type="text"
                  value={pgName}
                  onChange={(e) => setPgName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">PG Property Address</label>
                <textarea
                  value={pgAddress}
                  onChange={(e) => setPgAddress(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:bg-white"
                />
              </div>
            </div>

            {/* Sharing prices & billing rules */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-blue-600 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                Pricing & Billing Guidelines
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Single Price</label>
                  <input
                    type="number"
                    value={singlePrice}
                    onChange={(e) => setSinglePrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Double Price</label>
                  <input
                    type="number"
                    value={doublePrice}
                    onChange={(e) => setDoublePrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Triple Price</label>
                  <input
                    type="number"
                    value={triplePrice}
                    onChange={(e) => setTriplePrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Default Deposit</label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Rent Due Day of Month</label>
                  <input
                    type="number"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Grace Period (Days)</label>
                  <input
                    type="number"
                    value={graceDays}
                    onChange={(e) => setGraceDays(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Late Fee Flat Rate (₹)</label>
                  <input
                    type="number"
                    value={lateFee}
                    onChange={(e) => setLateFee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
                  />
                </div>
              </div>

            </div>

          </div>

          {/* Col 2: SMTP Mail settings */}
          <div className="space-y-6">
            
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-blue-600 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                SMTP Mail Settings
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">SMTP Server Host</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="e.g. smtp.gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Port Number</label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="587"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">SMTP Username (Email Address)</label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="e.g. manager@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">SMTP Password / App Secret</label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800"
                />
              </div>

              <div className="text-slate-500 text-[10px] leading-relaxed flex items-start gap-1.5 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Configure this using standard Hostinger SMTP or Gmail App Passwords. If left empty, automated mail notifications fall back to local log files simulation.
                </span>
              </div>
            </div>

            {/* Wi-Fi & Bank Settings */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-blue-600 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                <Settings className="w-4 h-4" />
                Wi-Fi &amp; Settlement Setup
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Wi-Fi Name (SSID)</label>
                  <input
                    type="text"
                    value={wifiName}
                    onChange={(e) => setWifiName(e.target.value)}
                    placeholder="e.g. MagicTick_Guest"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-805"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Wi-Fi Password</label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="e.g. guest@123"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-805"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Bank Account Name</label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="e.g. MagicTick PG Services"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-805"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Bank Account Number</label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="e.g. 1234567890"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-805"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">IFSC Code</label>
                  <input
                    type="text"
                    value={bankIfscCode}
                    onChange={(e) => setBankIfscCode(e.target.value)}
                    placeholder="e.g. UTIB0000123"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-805"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Owner UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. owner@upi"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-805"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">UPI QR Code URL</label>
                  <input
                    type="text"
                    value={qrCodeUrl}
                    onChange={(e) => setQrCodeUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-805"
                  />
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Form Actions */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm active:scale-95 transition-all"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Configurations...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configurations</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
