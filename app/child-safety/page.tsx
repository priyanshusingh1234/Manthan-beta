'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Users,
  CheckCircle,
  Eye,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';

export default function ChildSafetyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Child Safety</h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            How we protect minors on Dheeyudha.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
            <p className="text-sm text-slate-700">
              We keep the platform educational, respectful, and age-appropriate.
            </p>
          </div>

          <div className="p-4 sm:p-5 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-2 text-slate-900 font-medium">
                <Eye className="w-4 h-4 text-blue-600" /> Age confirmation
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  Users confirm they are 14+ during signup.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  Accounts are expected to follow age requirements.
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-2 text-slate-900 font-medium">
                <Users className="w-4 h-4 text-violet-600" /> Community standards
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  Respectful behavior is required.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  Do not share personal contact information.
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-2 text-slate-900 font-medium">
                <MessageSquare className="w-4 h-4 text-emerald-600" /> Education first
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  Platform features are focused on learning and competition.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  School and teacher structure helps maintain discipline.
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-2 text-slate-900 font-medium">
                <Lock className="w-4 h-4 text-amber-600" /> Privacy
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  We collect only required account data.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  We do not sell user data.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <Link
            href="/privacy"
            className="flex items-center justify-between px-4 sm:px-5 py-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-slate-900 font-medium">
              <Shield className="w-4 h-4 text-blue-600" /> Privacy Policy
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>

          <a
            href="mailto:kpk22128@gmail.com"
            className="flex items-center justify-between px-4 sm:px-5 py-4 border-t border-slate-100 hover:bg-slate-50 transition-colors"
          >
            <div className="text-slate-900 font-medium">Contact support</div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>
        </div>

        <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-3">FAQ</h2>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <p className="font-medium text-slate-900">Minimum age?</p>
              <p>Users must confirm they are 14 years or older.</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">How to report issues?</p>
              <p>Use the in-app report option or contact support directly.</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Can I delete my account?</p>
              <p>Yes, account deletion can be requested from settings/support.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
