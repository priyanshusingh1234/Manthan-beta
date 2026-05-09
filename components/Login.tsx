"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Mail, Lock, Eye, EyeOff, Github, Chrome, BookOpen, Brain, Sparkles, Trophy, Users } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import Logo from './Logo';
import BrandingSection from './BrandingSection';
/**
 * Login component with split-screen layout
 * Left side: Login form
 * Right side: Creative branding section
 */
const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true)
    setError('')
    supabase.auth.signInWithPassword({ email, password })
      .then(({ error }) => {
        if (error) {
          console.error('Login error from Supabase:', {
            name: error?.name,
            message: error?.message,
            status: error?.status,
            fullError: error
          });
          setError(error.message)
        } else {
          // Persist email if requested
          try {
            if (rememberMe) localStorage.setItem('dheeyudha_remember_email', email)
            else localStorage.removeItem('dheeyudha_remember_email')
          } catch (err) { void err }
          router.push('/profile')
        }
      })
      .catch((err) => {
        console.error('Login error details:', {
          name: err?.name,
          message: err?.message,
          stack: err?.stack,
          fullError: err
        });

        let userMessage = 'Login failed';
        const errorMessage = err?.message?.toLowerCase() || '';

        if (errorMessage.includes('fetch') || errorMessage.includes('failed to fetch')) {
          userMessage += ' - Network error. Please check your connection or try again later.';
        } else if (errorMessage.includes('invalid login credentials')) {
          userMessage += ' - Invalid email or password.';
        } else if (errorMessage.includes('supabase') || errorMessage.includes('configuration')) {
          userMessage += ' - Service configuration error. Please contact support.';
        } else if (err?.message) {
          userMessage += ` - ${err.message}`;
        } else {
          userMessage += '. Please try again.';
        }

        setError(userMessage);
      })
      .finally(() => setLoading(false))
  };

  // Load remembered email on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('dheeyudha_remember_email')
      if (saved) {
        setEmail(saved)
        setRememberMe(true)
      }
    } catch (err) { void err }
  }, [])

  return (
    <div className="min-h-screen bg-slate-950/90 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background Ambience (Optional blurring or gradients behind the card) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(59,130,246,0.08)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(139,92,246,0.08)_0%,_transparent_50%)]"></div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-5xl lg:max-h-[85vh] lg:h-[85vh] max-h-[95vh] bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100">
        {/* Left Side - Login Form */}
        <div className="flex-1 flex flex-col items-center justify-start lg:justify-center px-4 sm:px-8 lg:px-10 bg-white overflow-y-auto scrollbar-hide py-8 lg:py-0">
          <div className="w-full max-w-sm space-y-6 animate-slideUp">
            {/* Mobile Logo - Only show on small screens */}
            <div className="lg:hidden flex justify-center mb-6">
              <Logo width={90} height={90} showTagline={true} />
            </div>

            {/* Header */}
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, Brain!
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Ready to continue your knowledge battle?
              </p>
              {/* Mobile quick sign-up button removed per layout request */}
            </div>

            {/* Login Form */}
            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-3">
                {/* Email Input */}
                <div className="group">
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-slate-400"
                      placeholder="Email address"
                    />
                    {/* Gradient border on focus */}
                    <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 blur-sm transition-opacity duration-300 group-focus-within:opacity-100"></div>
                  </div>
                </div>

                {/* Password Input */}
                <div className="group">
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-12 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-slate-400"
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:scale-110 transition-transform duration-200"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                      )}
                    </button>
                    {/* Gradient border on focus */}
                    <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 blur-sm transition-opacity duration-300 group-focus-within:opacity-100"></div>
                  </div>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all duration-200 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700 cursor-pointer">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    href="/forgot-password"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Login Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                >
                  {loading ? 'Signing in…' : 'Sign in to Dheeyudha'}
                </button>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Or continue with</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (Capacitor.isNativePlatform()) {
                      try {
                        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
                        GoogleAuth.initialize();
                        const googleUser = await GoogleAuth.signIn();
                        const idToken = googleUser.authentication.idToken;
                        if (idToken) {
                          const { error: authErr } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
                          if (authErr) throw authErr;
                          router.push('/profile');
                        }
                      } catch (err: any) {
                        setError('Google Native Login Failed: ' + (err?.message || 'Unknown error'));
                      }
                    } else {
                      supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/profile` } });
                    }
                  }}
                  className="flex items-center justify-center px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 hover:shadow-md w-full"
                >
                  <Chrome className="h-5 w-5 mr-2" />
                  Continue with Google
                </button>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/signup"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Creative/Branding Section */}
        <BrandingSection
          title="Join the Knowledge Battle"
          subtitle="Compete, learn, and conquer challenges with students from across schools!"
        />
      </div>
    </div>
  );
};

export default Login;
