'use client';

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom' // [!code highlight]
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false) // [!code highlight]
  const pathname = usePathname()

  // Handle mounting for Portal (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

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

  // Skip rendering full header on login/signup pages
  if (pathname === '/login' || pathname === '/signup') {
    return null
  }

  // Helper function to determine if a link is active
  const isActive = (path) => pathname === path

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
          {/* Mobile menu button - hidden on desktop */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden inline-flex items-center justify-center rounded-xl p-2 text-white/90 hover:bg-white/20 transition-all duration-300 hover:shadow-lg hover:scale-105"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Desktop navigation - inline horizontal links */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link 
              href="/" 
              className={`font-medium transition-colors duration-200 hover:underline underline-offset-4 ${
                isActive('/') ? 'text-white font-semibold' : 'text-white/90 hover:text-white'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/leaderboard"
              className={`font-medium transition-colors duration-200 hover:underline underline-offset-4 ${
                isActive('/leaderboard') ? 'text-white font-semibold' : 'text-white/90 hover:text-white'
              }`}
            >
              Leaderboard
            </Link>
            <Link 
              href="/contact"
              className={`font-medium transition-colors duration-200 hover:underline underline-offset-4 ${
                isActive('/contact') ? 'text-white font-semibold' : 'text-white/90 hover:text-white'
              }`}
            >
              Contact
            </Link>
            <Link 
              href="/about"
              className={`font-medium transition-colors duration-200 hover:underline underline-offset-4 ${
                isActive('/about') ? 'text-white font-semibold' : 'text-white/90 hover:text-white'
              }`}
            >
              About
            </Link>
            <Link 
              href="/signup"
              className={`font-medium transition-colors duration-200 hover:underline underline-offset-4 ${
                isActive('/signup') ? 'text-white font-semibold' : 'text-white/90 hover:text-white'
              }`}
            >
              Sign Up
            </Link>
            <Link 
              href="/login"
              className={`font-medium transition-colors duration-200 hover:underline underline-offset-4 ${
                isActive('/login') ? 'text-white font-semibold' : 'text-white/90 hover:text-white'
              }`}
            >
              Sign In
            </Link>
          </nav>

          <Link 
            href="/profile"
            className="inline-flex items-center justify-center rounded-full p-1 hover:scale-110 transition-transform duration-300"
            aria-label="Go to profile"
          >
            <Image
              src="/avatar.png"
              alt="User avatar"
              width={32}
              height={32}
              className="rounded-full border-2 border-white/80 object-cover shadow-lg"
              onError={(e) => {
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23e5e7eb'/%3E%3Cpath d='M16 16a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.42 0-8 2.91-8 6.5V28h16v-3.5c0-3.59-3.58-6.5-8-6.5z' fill='%239ca3af'/%3E%3C/svg%3E";
              }}
            />
          </Link>
        </div>

        {/* --- PORTAL START --- */}
        {/* We portal the entire mobile menu system to the body to escape stacking contexts */}
        {mounted && createPortal(
          <>
            {/* Overlay backdrop - z-index 9998 */}
            <div 
              className={`lg:hidden fixed inset-0 bg-black/40 z-[9998] transition-opacity duration-300 ${
                menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Mobile top-down slider menu - z-index 9999 */}
            <div 
              id="mobile-menu"
              className={`lg:hidden fixed top-0 left-0 right-0 h-screen bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out ${
                menuOpen ? 'translate-y-0' : '-translate-y-full'
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
                <Link 
                  href="/" 
                  onClick={() => setMenuOpen(false)}
                  className={`block px-6 py-3 hover:bg-blue-50 transition-colors duration-200 font-medium ${
                    isActive('/') ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-900'
                  }`}
                >
                  Home
                </Link>
                <Link 
                  href="/leaderboard"
                  onClick={() => setMenuOpen(false)}
                  className={`block px-6 py-3 hover:bg-blue-50 transition-colors duration-200 font-medium ${
                    isActive('/leaderboard') ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-900'
                  }`}
                >
                  Leaderboard
                </Link>
                <Link 
                  href="/contact"
                  onClick={() => setMenuOpen(false)}
                  className={`block px-6 py-3 hover:bg-blue-50 transition-colors duration-200 font-medium ${
                    isActive('/contact') ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-900'
                  }`}
                >
                  Contact
                </Link>
                <Link 
                  href="/about"
                  onClick={() => setMenuOpen(false)}
                  className={`block px-6 py-3 hover:bg-blue-50 transition-colors duration-200 font-medium ${
                    isActive('/about') ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-900'
                  }`}
                >
                  About
                </Link>
                <Link 
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className={`block px-6 py-3 hover:bg-blue-50 transition-colors duration-200 font-medium ${
                    isActive('/signup') ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-900'
                  }`}
                >
                  Sign Up
                </Link>
                <Link 
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className={`block px-6 py-3 hover:bg-blue-50 transition-colors duration-200 font-medium ${
                    isActive('/login') ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-900'
                  }`}
                >
                  Sign In
                </Link>
              </nav>
            </div>
          </>,
          document.body
        )}
        {/* --- PORTAL END --- */}

        {/* Centered logo with pulse effect */}
        <div className="flex items-center justify-center py-3">
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

      {/* spacer height for header - reduced */}
      <div className="h-24" />
    </header>
  )
}
