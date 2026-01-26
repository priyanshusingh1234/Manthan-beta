"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Mail, Lock, Eye, EyeOff, Github, Chrome, BookOpen, Brain, Sparkles, Trophy, Users } from 'lucide-react';
import Logo from './Logo';

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
              setError(error.message)
            } else {
              router.push('/profile')
            }
          })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-white">
        <div className="w-full max-w-md space-y-8 animate-slideUp">
          {/* Mobile Logo - Only show on small screens */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo width={120} height={120} showTagline={true} />
          </div>

          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, Brain!
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Ready to continue your knowledge battle?
            </p>
          </div>

          {/* Login Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
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
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-slate-400"
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
                    className="block w-full pl-10 pr-12 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-slate-400"
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
                <a
                  href="#"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Login Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Sign in to Manthan'}
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
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
                className="flex items-center justify-center px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 hover:shadow-md"
              >
                <Chrome className="h-5 w-5 mr-2" />
                Google
              </button>
              <button
                type="button"
                onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}
                className="flex items-center justify-center px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 hover:shadow-md"
              >
                <Github className="h-5 w-5 mr-2" />
                GitHub
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
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-600 animate-gradient">
        {/* Animated background overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 70% 30%, rgba(139, 92, 246, 0.4) 0%, transparent 50%)'
          }}
        />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          {/* Logo with Animation */}
          <div className="animate-float mb-8">
            <Logo width={180} height={180} showTagline={true} taglineColor="white" />
          </div>

          {/* Welcome Message */}
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-lg">
              Join the Knowledge Battle
            </h1>
            <p className="text-xl text-blue-100 max-w-md">
              Compete, learn, and conquer challenges with students from across schools!
            </p>
          </div>

          {/* Floating Feature Cards */}
          <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
            {/* Feature 1 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-slideUp" style={{ animationDelay: '0.1s' }}>
              <Brain className="h-8 w-8 mb-3 text-emerald-300" />
              <h3 className="text-lg font-bold mb-2">Brain Wars</h3>
              <p className="text-sm text-blue-100">Challenge students in epic knowledge battles</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <Trophy className="h-8 w-8 mb-3 text-yellow-300" />
              <h3 className="text-lg font-bold mb-2">Leaderboards</h3>
              <p className="text-sm text-blue-100">Climb to the top and earn glory</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-slideUp" style={{ animationDelay: '0.3s' }}>
              <BookOpen className="h-8 w-8 mb-3 text-pink-300" />
              <h3 className="text-lg font-bold mb-2">Learn & Grow</h3>
              <p className="text-sm text-blue-100">Master subjects through competition</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-slideUp" style={{ animationDelay: '0.4s' }}>
              <Users className="h-8 w-8 mb-3 text-blue-300" />
              <h3 className="text-lg font-bold mb-2">School Wars</h3>
              <p className="text-sm text-blue-100">Represent your school with pride</p>
            </div>
          </div>

          {/* Floating Decorative Elements */}
          <div className="absolute top-20 left-10 animate-float" style={{ animationDelay: '0s', animationDuration: '6s' }}>
            <Sparkles className="h-12 w-12 text-yellow-300 opacity-60" />
          </div>
          <div className="absolute bottom-32 right-16 animate-float" style={{ animationDelay: '1s', animationDuration: '7s' }}>
            <Sparkles className="h-8 w-8 text-pink-300 opacity-50" />
          </div>
          <div className="absolute top-1/3 right-20 animate-float" style={{ animationDelay: '2s', animationDuration: '5s' }}>
            <Brain className="h-10 w-10 text-emerald-300 opacity-40" />
          </div>
          <div className="absolute bottom-20 left-16 animate-float" style={{ animationDelay: '1.5s', animationDuration: '6.5s' }}>
            <Trophy className="h-10 w-10 text-yellow-400 opacity-40" />
          </div>
        </div>

        {/* Gradient Glow Effect */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
          }}
        />
      </div>
    </div>
  );
};

export default Login;
