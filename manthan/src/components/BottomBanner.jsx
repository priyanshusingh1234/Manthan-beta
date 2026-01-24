'use client';

import { BadgeCheck, Sparkles } from 'lucide-react'

export default function BottomBanner() {
  return (
    <div className="fixed inset-x-0 bottom-3 z-[60] px-4 sm:px-6 lg:px-8 animate-slideUp">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-purple-500 p-4 shadow-2xl ring-1 ring-white/20 animate-gradient" style={{ backgroundSize: '150% 150%' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-yellow-900 shadow-lg animate-pulse-soft">
              <BadgeCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Go Pro for ₹49/month
              </p>
              <p className="text-xs text-white/90">No Ads • Verified Badge • Priority Support</p>
            </div>
          </div>
          <button className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2 text-sm font-semibold text-blue-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 active:scale-95">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  )
}
