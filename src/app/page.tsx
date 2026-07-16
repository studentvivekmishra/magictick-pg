'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Sparkles, Building, KeyRound, ArrowRight, ShieldCheck, RefreshCw, Home, Download } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const router = useRouter();

  // PWA installer states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iosDetect = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iosDetect);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (!isStandalone) {
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  useEffect(() => {
    // Check if already logged in
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          if (data.user.role === 'TENANT') {
            router.push('/tenant');
          } else if (data.user.role === 'SUPER_ADMIN') {
            router.push('/super-admin');
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
        } else if (data.user.role === 'SUPER_ADMIN') {
          router.push('/super-admin');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('Connection failure. Make sure database is seeded.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async (role: 'superadmin' | 'owner' | 'manager' | 'tenant') => {
    setSeeding(true);
    setError('');
    
    let demoEmail = 'owner@pgnexus.com';
    if (role === 'superadmin') demoEmail = 'superadmin@magictick.com';
    if (role === 'manager') demoEmail = 'manager@pgnexus.com';
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

      {/* Main card box */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-sm z-10 relative">
        <div className="space-y-6">
          
          {/* Logo & Headline */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center bg-blue-600 text-white p-3 rounded-2xl shadow-md shadow-blue-500/20">
              <Building className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-1">
                MagicTick PG <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
              </h1>
              <p className="text-xs text-slate-500 font-medium">SaaS Multitenant PG Management Platform</p>
            </div>
          </div>

          {/* PWA Install Button */}
          {isInstallable && (
            <button
              type="button"
              onClick={handleInstallApp}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-2.5 px-4 rounded-xl text-[10px] uppercase tracking-wider shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Mobile/Desktop App</span>
            </button>
          )}

          <div className="space-y-4">
            
            {/* Error alerts */}
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 font-bold p-3 rounded-2xl text-[10px] leading-relaxed text-center">
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

            {/* Quick Demo Access selectors (5-role system) */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleDemoAccess('superadmin')}
                disabled={seeding || loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-center text-[10px] font-bold transition-all shadow-sm"
              >
                {seeding ? 'Syncing...' : 'SaaS Super Admin (System Operator)'}
              </button>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleDemoAccess('owner')}
                  disabled={seeding || loading}
                  className="bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded-xl py-2 text-center text-[10px] font-bold transition-all text-slate-700"
                >
                  Owner
                </button>
                <button
                  onClick={() => handleDemoAccess('manager')}
                  disabled={seeding || loading}
                  className="bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded-xl py-2 text-center text-[10px] font-bold transition-all text-slate-700"
                >
                  Manager
                </button>
                <button
                  onClick={() => handleDemoAccess('tenant')}
                  disabled={seeding || loading}
                  className="bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 border border-emerald-200 rounded-xl py-2 text-center text-[10px] font-bold transition-all text-emerald-800"
                >
                  Tenant
                </button>
              </div>
            </div>
            
            {seeding && (
              <p className="text-[10px] text-center text-blue-600 font-semibold mt-3 animate-pulse">
                Bootstrapping local MySQL tables with mock PG accounts...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* PWA Install Guide Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 font-sans text-xs">
          <div className="bg-white border border-slate-200 max-w-sm w-full p-6 rounded-3xl shadow-xl space-y-4 text-center">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-inner">
              <Download className="w-6 h-6 animate-bounce" />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900">How to Install PWA App</h3>
              
              {isIOS ? (
                <div className="text-slate-500 font-semibold leading-relaxed text-left space-y-1">
                  <p>1. Tap the <span className="font-bold text-blue-600">Share button</span> (square with arrow up icon) in Safari at the bottom of the screen.</p>
                  <p>2. Scroll down and select <span className="font-bold text-slate-900">"Add to Home Screen"</span>.</p>
                  <p>3. Tap <span className="font-bold text-blue-600">Add</span> to complete the setup.</p>
                </div>
              ) : (
                <div className="text-slate-500 font-semibold leading-relaxed text-left space-y-1">
                  <p>1. Open the browser's settings menu (three dots in Chrome on Android, or Chrome options on Desktop).</p>
                  <p>2. Select <span className="font-bold text-slate-900">"Install app"</span> or <span className="font-bold text-slate-900">"Add to Home screen"</span>.</p>
                  <p>3. Follow the prompt to complete installation.</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs active:scale-95 transition-transform"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
