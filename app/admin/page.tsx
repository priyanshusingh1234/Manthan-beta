"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, FileText, CheckCircle, Bell, Users, ChevronLeft } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8">
      <button 
        onClick={() => router.push('/')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold mb-8 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" /> Back to App
      </button>

      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
          <Settings className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">Admin Control</h1>
          <p className="text-slate-500 font-medium mt-1">Manage tests, grading, teachers, and system features.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Create Test Card */}
        <Link href="/admin/tests/create" className="group block bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FileText className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Create Test</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            Easily build and publish new tests. Add MCQ and Subjective written questions securely.
          </p>
        </Link>

        {/* Grade Submissions Card */}
        <Link href="/admin/grading" className="group block bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Grade Tests</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            Review and grade written test submissions. Finalize scores for the leaderboard.
          </p>
        </Link>

        {/* Manage Teachers Card */}
        <Link href="/teacher/dashboard" className="group block bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Teachers & Staff</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            Approve teacher applications and manage staff permissions for grading.
          </p>
        </Link>

        {/* Send Notifications Card */}
        <Link href="/admin/notify" className="group block bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Bell className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Push Notifications</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            Send global or targeted alerts to all users for announcements or updates.
          </p>
        </Link>

      </div>
    </div>
  );
}
