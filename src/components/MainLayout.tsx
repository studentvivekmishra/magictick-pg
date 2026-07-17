'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PWALoader from '@/components/PWALoader';
import AICompanion from '@/components/AICompanion';
import { RefreshCw, Menu, Building, LayoutDashboard, Home, Users, CreditCard, AlertOctagon, FileText } from 'lucide-react';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState('');

  const isPublicPage = pathname === '/' || pathname === '/unauthorized';

  useEffect(() => {
    // Auto-close sidebar drawer on route transition
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentHash(window.location.hash || '');
      const handleHashChange = () => {
        setCurrentHash(window.location.hash || '');
      };
      window.addEventListener('hashchange', handleHashChange);
      return () => {
        window.removeEventListener('hashchange', handleHashChange);
      };
    }
  }, []);

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

  const getBottomNavItems = () => {
    if (!user) return [];
    
    if (user.role === 'TENANT') {
      return [
        { name: 'Dashboard', path: '/tenant', icon: LayoutDashboard },
        { name: 'Payments', path: '/tenant#payments', icon: CreditCard },
        { name: 'Complaints', path: '/tenant#complaints', icon: AlertOctagon },
        { name: 'Documents', path: '/tenant#agreements', icon: FileText },
        { name: 'Profile', path: '/tenant#profile', icon: Users }
      ];
    }

    return [
      { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Rooms', path: '/rooms', icon: Home },
      { name: 'Guests', path: '/customers', icon: Users },
      { name: 'Payments', path: '/payments', icon: CreditCard },
      { name: 'More', path: '#', icon: Menu, action: 'menu' }
    ];
  };

  const bottomNavItems = getBottomNavItems();

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
      
      {/* Responsive Sidebar Drawer */}
      {user && (
        <Sidebar 
          user={user} 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 pl-0 md:pl-64 flex flex-col min-h-screen relative">
        
        {/* Mobile Header Bar */}
        <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30 md:hidden shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 active:scale-95 transition-transform"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-extrabold text-sm text-slate-800 tracking-tight">MagicTick PG</span>
          </div>
          {user && (
            <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {user.role}
            </span>
          )}
        </header>

        {/* Dynamic Margin/Padding adjustments */}
        <main className="flex-1 p-4 pt-20 pb-20 md:pb-8 md:pt-8 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>

        {/* Bottom Navigation Bar for Mobile */}
        {user && (
          <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-30 flex items-center justify-around md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.03)] pb-safe">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              
              // Calculate path and hash active states
              const itemPathWithoutHash = item.path.split('#')[0];
              const itemHash = item.path.includes('#') ? '#' + item.path.split('#')[1] : '';
              
              const isActive = item.path !== '#' && (
                itemHash 
                  ? (pathname === itemPathWithoutHash && currentHash === itemHash)
                  : (pathname === item.path && (!currentHash || currentHash === '#dashboard' || currentHash === '#bugs' || currentHash === '#contact'))
              );

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    if (item.action === 'menu') {
                      setSidebarOpen(true);
                    } else {
                      router.push(item.path);
                    }
                  }}
                  className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-0.5 text-center active:scale-95 transition-transform ${
                    isActive ? 'text-blue-600' : 'text-slate-500'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{item.name}</span>
                </button>
              );
            })}
          </nav>
        )}
        
        {user && user.role !== 'TENANT' && <AICompanion user={user} />}
      </div>
    </div>
  );
}
