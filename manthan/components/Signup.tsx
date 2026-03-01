"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Mail, Lock, Eye, EyeOff, Github, Chrome, BookOpen, Brain, Sparkles, Trophy, Users, User, Building2, GraduationCap } from 'lucide-react';
import Logo from './Logo';
import BrandingSection from './BrandingSection';
/**
 * Signup component with split-screen layout
 * Left side: Signup form
 * Right side: Creative branding section
 */
const Signup: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [school, setSchool] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsername(val);
    if (error) setError('');

    if (/[A-Z]/.test(val)) {
      setError('Username cannot contain uppercase letters');
    } else if (/\s/.test(val)) {
      setError('Username cannot contain spaces');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeToTerms) {
      setError('You must agree to the terms and privacy policy');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (/[A-Z]/.test(username)) {
      setError('Username cannot contain uppercase letters');
      return;
    }
    if (/\s/.test(username)) {
      setError('Username cannot contain spaces');
      return;
    }
    if (!school.trim()) {
      setError('School name is required to join a faction');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check username uniqueness via api route
      const uniqueCheckRes = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);
      if (uniqueCheckRes.ok) {
        const uniqueCheckData = await uniqueCheckRes.json();
        if (!uniqueCheckData.isUnique) {
          setError('Username is already taken');
          setLoading(false);
          return;
        }
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            fullName,
            school,
            classGrade,
            username_updates: [] // Track updates
          }
        }
      });

      if (signUpError) throw signUpError;

      router.push('/profile');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950/90 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background Ambience (Optional blurring or gradients behind the card) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(59,130,246,0.08)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(139,92,246,0.08)_0%,_transparent_50%)]"></div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-5xl lg:max-h-[85vh] lg:h-[85vh] max-h-[95vh] bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100">
        {/* Left Side - Signup Form */}
        <div className="flex-1 flex flex-col items-center justify-start lg:justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-y-auto scrollbar-hide py-8 lg:py-0 relative">

          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes fall {
              0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
              10% { opacity: 0.4; }
              90% { opacity: 0.4; }
              100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
            }
          `}} />
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute text-white font-black text-4xl opacity-50 drop-shadow-lg"
                style={{
                  left: `${(i * 7) % 100}%`,
                  animation: `fall ${10 + (i % 5) * 2}s linear infinite`,
                  animationDelay: `${-(i % 10)}s`
                }}
              >
                ?
              </div>
            ))}
          </div>
          <div className="w-full max-w-md space-y-4 animate-slideUp relative z-10 bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-white/50 my-auto sm:my-8 lg:my-0">
            {/* Mobile Logo - Only show on small screens */}
            <div className="lg:hidden flex justify-center mb-6">
              <Logo width={90} height={90} showTagline={true} />
            </div>

            {/* Header */}
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Start Your Journey
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Join the Brain Battle and become a Knowledge Champion
              </p>
            </div>

            {/* Signup Form */}
            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-3">
                {/* Row 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Username Input */}
                  <div className="group">
                    <label htmlFor="username" className="sr-only">
                      Username
                    </label>
                    <div className="relative my-2">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                      </div>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        required
                        value={username}
                        onChange={handleUsernameChange}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-slate-400 font-mono"
                        placeholder="Username"
                      />
                      {/* Gradient border on focus */}
                      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 blur-sm transition-opacity duration-300 group-focus-within:opacity-100"></div>
                    </div>
                  </div>

                  {/* Full Name Input */}
                  <div className="group">
                    <label htmlFor="fullName" className="sr-only">
                      Full Name
                    </label>
                    <div className="relative my-2">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                      </div>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        autoComplete="name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-slate-400"
                        placeholder="Full Name"
                      />
                      {/* Gradient border on focus */}
                      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 blur-sm transition-opacity duration-300 group-focus-within:opacity-100"></div>
                    </div>
                  </div>
                </div>

                {/* Email Input */}
                <div className="group">
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <div className="relative my-2">
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

                {/* Row 3 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Password Input */}
                  <div className="group">
                    <label htmlFor="password" className="sr-only">
                      Password
                    </label>
                    <div className="relative my-2">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
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

                  {/* Confirm Password Input */}
                  <div className="group">
                    <label htmlFor="confirmPassword" className="sr-only">
                      Confirm Password
                    </label>
                    <div className="relative my-2">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-10 pr-12 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-slate-400"
                        placeholder="Confirm Pass"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:scale-110 transition-transform duration-200"
                      >
                        {showConfirmPassword ? (
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

                {/* Row 4 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* School/Institution Input (Required) */}
                  <div className="group">
                    <label htmlFor="school" className="sr-only">
                      School/Institution (Required)
                    </label>
                    <div className="relative my-2">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                      </div>
                      <input
                        id="school"
                        name="school"
                        type="text"
                        required
                        autoComplete="organization"
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-slate-400"
                        placeholder="School/Institution"
                      />
                      {/* Gradient border on focus */}
                      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 blur-sm transition-opacity duration-300 group-focus-within:opacity-100"></div>
                    </div>
                  </div>

                  {/* Class/Grade Dropdown (Required) */}
                  <div className="group">
                    <label htmlFor="class" className="sr-only">
                      Class/Grade
                    </label>
                    <div className="relative my-2">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <GraduationCap className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                      </div>
                      <select
                        id="class"
                        name="class"
                        required
                        value={classGrade}
                        onChange={(e) => setClassGrade(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-slate-400 appearance-none bg-white"
                      >
                        <option value="">Select Class/Grade</option>
                        <option value="6">Class 6</option>
                        <option value="7">Class 7</option>
                        <option value="8">Class 8</option>
                        <option value="9">Class 9</option>
                        <option value="10">Class 10</option>
                        <option value="11">Class 11</option>
                        <option value="12">Class 12</option>
                      </select>
                      {/* Gradient border on focus */}
                      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 blur-sm transition-opacity duration-300 group-focus-within:opacity-100"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  required
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all duration-200 cursor-pointer"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-slate-700 cursor-pointer">
                  I agree to{' '}
                  <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">Privacy Policy</Link>
                </label>
              </div>

              {/* Signup Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                >
                  {loading ? 'Creating…' : 'Create Account'}
                </button>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Or sign up with</span>
                </div>
              </div>

              {/* Social Signup */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
                  className="flex items-center justify-center px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 hover:shadow-md"
                >
                  <Chrome className="h-5 w-5 mr-2" />
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}
                  className="flex items-center justify-center px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 hover:shadow-md"
                >
                  <Github className="h-5 w-5 mr-2" />
                  GitHub
                </button>
              </div>

              {/* Sign In Link */}
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                  >
                    Sign in
                  </Link>
                </p>

              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Creative/Branding Section */}
        <BrandingSection
          title="Become a Knowledge Champion"
          subtitle="Start your journey, compete with peers, and master subjects through epic battles!"
        />
      </div>
    </div>
  );
};

export default Signup;
