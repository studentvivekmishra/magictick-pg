'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PWALoader from '@/components/PWALoader';
import AICompanion from '@/components/AICompanion';
import { RefreshCw } from 'lucide-react';

interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'TENANT';
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const isPublicPage = pathname === '/' || pathname === '/unauthorized';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        
        if (data.authenticated) {
          setUser(data.user);
          if (pathname === '/') {
            if (data.user.role === 'TENANT') {
              router.push('/tenant');
            } else {
              router.push('/dashboard');
            }
          }
        } else {
          setUser(null);
          if (!isPublicPage) {
            router.push('/');
          }
        }
      } catch (err) {
        setUser(null);
        if (!isPublicPage) {
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (loading && !isPublicPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-500">Verifying operational session...</p>
      </div>
    );
  }

  // Render clean layout without Sidebar/AI for login page and unauthorized screens
  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 transition-colors duration-300">
      <PWALoader />
      {user && <Sidebar user={user} />}
      <div className="flex-1 pl-64 flex flex-col min-h-screen relative">
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
        {user && user.role !== 'TENANT' && <AICompanion user={user} />}
      </div>
    </div>
  );
}
