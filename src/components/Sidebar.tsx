'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from './ThemeContext';
import {
  LayoutDashboard,
  Home,
  Users,
  CreditCard,
  FileText,
  AlertOctagon,
  TrendingUp,
  UserCheck,
  DollarSign,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  Settings,
  X,
} from 'lucide-react';

interface SidebarProps {
  user: {
    userId: string;
    name: string;
    email: string;
    role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'TENANT';
  } | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      router.push('/');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Base navigation items - adjusted paths and roles
  const menuItems = [
    { name: 'Dashboard', path: user.role === 'TENANT' ? '/tenant' : '/dashboard', icon: LayoutDashboard, roles: ['OWNER', 'MANAGER', 'RECEPTIONIST', 'TENANT'] },
    { name: 'Rooms & Beds', path: '/rooms', icon: Home, roles: ['OWNER', 'MANAGER', 'RECEPTIONIST'] },
    { name: 'Customers', path: '/customers', icon: Users, roles: ['OWNER', 'MANAGER', 'RECEPTIONIST'] },
    { name: 'Payments', path: '/payments', icon: CreditCard, roles: ['OWNER', 'MANAGER', 'RECEPTIONIST'] },
    { name: 'Rent Agreements', path: '/agreements', icon: FileText, roles: ['OWNER', 'MANAGER'] },
    { name: 'Complaints', path: '/complaints', icon: AlertOctagon, roles: ['OWNER', 'MANAGER', 'RECEPTIONIST'] },
    { name: 'Expenses', path: '/expenses', icon: DollarSign, roles: ['OWNER', 'MANAGER'] },
    { name: 'Visitors Log', path: '/visitors', icon: UserCheck, roles: ['OWNER', 'MANAGER', 'RECEPTIONIST'] },
    { name: 'Analytics', path: '/analytics', icon: TrendingUp, roles: ['OWNER'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['OWNER'] },
  ];

  const allowedMenuItems = menuItems.filter((item) => item.roles.includes(user.role));

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={`w-64 glass-nav h-screen fixed left-0 top-0 flex flex-col justify-between p-5 z-50 bg-slate-50 border-r border-slate-200 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Logo/Branding */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-slate-800">
                  MagicTick PG
                </h1>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mt-0.5">
                  ERP Panel
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1">
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            // Check active state
            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Settings footer */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
        {/* User Card */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-bold text-sm shadow-sm shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
            <span className="text-[9px] font-extrabold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider block w-max mt-0.5">
              {user.role}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all text-xs font-bold"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
    </>
  );
}
