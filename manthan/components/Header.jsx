'use client';

import { useState } from 'react'
import Link from 'next/link'
import { Menu, User, X } from 'lucide-react'
import Logo from './Logo'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <header className="relative isolate overflow-hidden">
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 animate-gradient" 
        style={{ backgroundSize: '150% 150%' }}
        aria-hidden="true" 
      />
      {/* Glowing overlay effect */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)'
        }}
        aria-hidden="true"
      />
      {/* Orange curved shape top-right with animation */}
      <div
        className="absolute right-0 top-0 h-40 w-2/3 bg-orange-400 transition-all duration-700"
        style={{
          clipPath: 'path("M0,0 C120,0 220,40 320,90 L320,0 Z")',
          WebkitClipPath: 'path("M0,0 C120,0 220,40 320,90 L320,0 Z")',
          opacity: 0.95,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Top nav */}
        <div className="flex items-center justify-between px-4 pt-4 sm:px-6 lg:px-8">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex items-center justify-center rounded-xl p-2 text-white/90 hover:bg-white/20 transition-all duration-300 hover:shadow-lg hover:scale-105"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <button className="inline-flex items-center justify-center rounded-full p-1 hover:scale-110 transition-transform duration-300">
            <img
              src="/avatar.png"
              onError={(e) => (e.currentTarget.src = 'https://placehold.co/32')}
              alt="User avatar"
              className="h-8 w-8 rounded-full border-2 border-white/80 object-cover shadow-lg"
            />
          </button>
        </div>

        {/* Mobile navigation menu */}
        {menuOpen && (
          <div className="absolute top-16 left-4 right-4 bg-white rounded-xl shadow-2xl ring-1 ring-black/5 overflow-hidden animate-slideUp z-50">
            <nav className="py-2">
              <Link 
                href="/" 
                onClick={() => setMenuOpen(false)}
                className="block px-6 py-3 text-gray-900 hover:bg-blue-50 transition-colors duration-200 font-medium"
              >
                Home
              </Link>
              <Link 
                href="/leaderboard"
                onClick={() => setMenuOpen(false)}
                className="block px-6 py-3 text-gray-900 hover:bg-blue-50 transition-colors duration-200 font-medium"
              >
                Leaderboard
              </Link>
              <Link 
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="block px-6 py-3 text-gray-900 hover:bg-blue-50 transition-colors duration-200 font-medium"
              >
                Contact
              </Link>
              <Link 
                href="/about"
                onClick={() => setMenuOpen(false)}
                className="block px-6 py-3 text-gray-900 hover:bg-blue-50 transition-colors duration-200 font-medium"
              >
                About
              </Link>
            </nav>
          </div>
        )}

        {/* Centered logo with pulse effect */}
        <div className="flex items-center justify-center py-6">
          <Link href="/" className="flex items-center gap-3 animate-fadeIn hover:scale-105 transition-transform duration-300">
            <div className="relative h-9 w-9 animate-pulse-soft">
              {/* Glow effect behind logo */}
              <div className="absolute inset-0 h-9 w-9 rounded-full bg-white/20 blur-sm"></div>
              <Logo width={36} height={36} />
            </div>
            <span className="text-2xl font-extrabold tracking-wide text-white drop-shadow-lg">MANTHAN</span>
          </Link>
        </div>
      </div>

      {/* spacer height for header */}
      <div className="h-44" />
    </header>
  )
}
