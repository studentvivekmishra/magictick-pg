'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Sparkles, Building, KeyRound, ArrowRight, ShieldCheck, RefreshCw, Home } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          if (data.user.role === 'TENANT') {
            router.push('/tenant');
          } else {
            router.push('/dashboard');
          }
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogin = async (e?: React.FormEvent, customCredentials?: { email: string; pass: string }) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const targetEmail = customCredentials ? customCredentials.email : email;
    const targetPassword = customCredentials ? customCredentials.pass : password;

    if (!targetEmail || !targetPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.user.role === 'TENANT') {
          router.push('/tenant');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection failure. Make sure database is seeded.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async (role: 'owner' | 'manager' | 'receptionist' | 'tenant') => {
    setSeeding(true);
    setError('');
    
    let demoEmail = 'owner@pgnexus.com';
    if (role === 'manager') demoEmail = 'manager@pgnexus.com';
    if (role === 'receptionist') demoEmail = 'receptionist@pgnexus.com';
    if (role === 'tenant') demoEmail = 'tenant@pgnexus.com';

    try {
      // First hit the seeding route to ensure demo users and records exist in database
      const seedResponse = await fetch('/api/seed', { method: 'POST' });
      if (!seedResponse.ok) {
        throw new Error('Seed failed');
      }

      // Log in with the demo account
      await handleLogin(undefined, { email: demoEmail, pass: 'password123' });
    } catch (err) {
      setError('Database initialization failed. Ensure MySQL is running.');
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-50 overflow-hidden font-sans">
      {/* Soft background blue blur */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-4xl grid md:grid-cols-12 gap-8 items-center z-10">
        
        {/* Info Hero Col */}
        <div className="md:col-span-7 space-y-5 hidden md:block text-slate-800">
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-full w-max text-xs font-bold">
            <Sparkles className="w-4 h-4" />
            <span>MagicTick PG SaaS Platform</span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900">
            Professional operations software for{' '}
            <span className="text-blue-600">
              Paying Guest business.
            </span>
          </h1>
          <p className="text-slate-600 leading-relaxed text-sm max-w-md font-medium">
            Manage room bed occupancies, rent agreement templates, invoice collections, visitor logging, and utility expenses with automated email notifications.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-3 bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-bold text-xs text-slate-800">Local Files Upload</h4>
                <p className="text-[10px] text-slate-500">Secure uploads folder</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
              <Building className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="font-bold text-xs text-slate-800">Tenant Logins</h4>
                <p className="text-[10px] text-slate-500">Separate Guest Portal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login form card col */}
        <div className="md:col-span-5 w-full">
          <div className="bg-white border border-slate-200 p-7 rounded-2xl shadow-md relative">
            <div className="mb-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-sm mb-2.5">
                <Home className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Sign In</h2>
              <p className="text-xs text-slate-500 mt-1">Access MagicTick Dashboard portal</p>
            </div>

            {error && (
              <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs py-2 px-3 rounded-xl font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:bg-white text-slate-800 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:bg-white text-slate-800 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || seeding}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-2 mt-4"
              >
                {loading && !seeding ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-5 text-center">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative bg-white px-3 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                Quick Demo Access
              </span>
            </div>

            {/* Quick Demo Access selectors (updated with Tenant role) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDemoAccess('owner')}
                disabled={seeding || loading}
                className="bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded-xl py-2 text-center text-[10px] font-bold transition-all text-slate-700"
              >
                {seeding ? '...' : 'Owner'}
              </button>
              <button
                onClick={() => handleDemoAccess('manager')}
                disabled={seeding || loading}
                className="bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded-xl py-2 text-center text-[10px] font-bold transition-all text-slate-700"
              >
                {seeding ? '...' : 'Manager'}
              </button>
              <button
                onClick={() => handleDemoAccess('receptionist')}
                disabled={seeding || loading}
                className="bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded-xl py-2 text-center text-[10px] font-bold transition-all text-slate-700"
              >
                {seeding ? '...' : 'Staff'}
              </button>
              <button
                onClick={() => handleDemoAccess('tenant')}
                disabled={seeding || loading}
                className="bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200 rounded-xl py-2 text-center text-[10px] font-bold transition-all text-slate-700"
              >
                {seeding ? '...' : 'Guest Tenant'}
              </button>
            </div>
            
            {seeding && (
              <p className="text-[10px] text-center text-blue-600 font-semibold mt-3 animate-pulse">
                Bootstrapping local MySQL tables with mock PG accounts...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
