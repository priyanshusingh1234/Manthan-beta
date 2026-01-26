'use client';

import { useState, useEffect } from 'react'
import { BadgeCheck, Sparkles, X } from 'lucide-react'

export default function BottomBanner() {
  const [showModal, setShowModal] = useState(false)
  const [showBanner, setShowBanner] = useState(true)
  if (!showBanner) return null;
  return (
    <>
      <div className="fixed inset-x-0 bottom-3 z-[60] px-4 sm:px-6 lg:px-8 animate-slideUp">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-purple-500 p-4 shadow-2xl ring-1 ring-white/20 animate-gradient relative" style={{ backgroundSize: '150% 150%' }}>
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
            <button 
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2 text-sm font-semibold text-blue-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 active:scale-95"
            >
              Upgrade Now
            </button>
            {/* Cross button to hide banner */}
            <button
              onClick={() => setShowBanner(false)}
              className="absolute top-2 right-2 p-1 rounded-full text-white/80 hover:text-white bg-black/20 hover:bg-black/40 transition-colors z-10"
              aria-label="Close banner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Premium Modal with higher z-index than mobile slider */}
      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
            aria-hidden="true"
          />
          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4">
                <BadgeCheck className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Upgrade to Premium
              </h2>
              <p className="text-gray-600 mb-6">
                Get access to exclusive features and benefits
              </p>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">Ad-free experience</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <BadgeCheck className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">Verified badge</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">Priority support</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-6">
                ₹49<span className="text-lg font-normal text-gray-600">/month</span>
              </div>
              <button className="w-full inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 active:scale-95">
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
