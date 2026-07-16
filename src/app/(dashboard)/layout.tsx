import { cookies } from 'next/headers';
import Sidebar from '@/components/Sidebar';
import { verifyToken } from '@/lib/jwt';
import { redirect } from 'next/navigation';
import PWALoader from '@/components/PWALoader';
import AICompanion from '@/components/AICompanion';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/');
  }

  const user = verifyToken(token);
  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      <PWALoader />
      <Sidebar user={user} />
      <div className="flex-1 pl-64 flex flex-col min-h-screen relative">
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
        <AICompanion user={user} />
      </div>
    </div>
  );
}
