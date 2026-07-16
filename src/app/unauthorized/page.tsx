import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center border border-border shadow-2xl flex flex-col items-center gap-4">
        <div className="bg-red-500/10 text-red-500 p-4 rounded-full border border-red-500/20">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your current account role does not have permission to view this section (such as financial records or analytical charts). Please contact the PG Owner.
        </p>
        <Link
          href="/dashboard"
          className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-500/20 text-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
