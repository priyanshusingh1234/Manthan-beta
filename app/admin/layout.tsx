"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
  .split(',').map(e => e.trim().toLowerCase());

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAdmin(false);
        return;
      }
      const userEmail = session.user.email?.toLowerCase() || '';
      const authorized = ['kpk22128@gmail.com', 's61038955@gmail.com', ...ADMIN_EMAILS].includes(userEmail);
      setIsAdmin(authorized);
    } catch (e) {
      setIsAdmin(false);
    }
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center pb-20">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Verifying Security Clearance...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center pb-20 px-6 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-slate-500 font-medium mb-8 max-w-sm">
          You do not have administrative privileges to view this area.
        </p>
        <Link href="/" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-md">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 pb-20">
      {/* Top Banner indicating Admin Mode */}
      <div className="bg-slate-900 dark:bg-black text-white px-6 py-2 flex items-center justify-center text-xs font-bold tracking-widest uppercase gap-2 shadow-sm relative z-50">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
        Admin Mode Active
      </div>
      {children}
    </div>
  );
}
