'use client';

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [menuOpen])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

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
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <button className="inline-flex items-center justify-center rounded-full p-1 hover:scale-110 transition-transform duration-300">
            <Image
              src="/avatar.png"
              alt="User avatar"
              width={32}
              height={32}
              className="rounded-full border-2 border-white/80 object-cover shadow-lg"
            />
          </button>
        </div>

        {/* Overlay for mobile menu - z-index below drawer but above content */}
        {menuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile slide-out drawer menu - z-index above backdrop */}
        <div 
          id="mobile-menu"
          className={`fixed top-0 left-0 bottom-0 w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-hidden={!menuOpen}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <span className="text-lg font-bold text-gray-900">Menu</span>
            <button 
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="py-4">
            <a 
              href="/"
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-3 text-gray-900 hover:bg-blue-50 transition-colors duration-200 font-medium"
            >
              Home
            </a>
            <a 
              href="/leaderboard"
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-3 text-gray-900 hover:bg-blue-50 transition-colors duration-200 font-medium"
            >
              Leaderboard
            </a>
            <a 
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-3 text-gray-900 hover:bg-blue-50 transition-colors duration-200 font-medium"
            >
              Contact
            </a>
            <a 
              href="/about"
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-3 text-gray-900 hover:bg-blue-50 transition-colors duration-200 font-medium"
            >
              About
            </a>
          </nav>
        </div>

        {/* Centered logo with pulse effect */}
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-3 animate-fadeIn">
            <div className="relative h-9 w-9 animate-pulse-soft">
              {/* Glow effect behind logo */}
              <div className="absolute inset-0 h-9 w-9 rounded-full bg-white/20 blur-sm"></div>
              <Logo width={36} height={36} />
            </div>
            <span className="text-2xl font-extrabold tracking-wide text-white drop-shadow-lg">MANTHAN</span>
          </div>
        </div>
      </div>

      {/* spacer height for header */}
      <div className="h-24" />
    </header>
  )
}
