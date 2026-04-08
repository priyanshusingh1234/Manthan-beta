'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Users,
  AlertCircle,
  CheckCircle,
  Eye,
  BarChart,
  MessageSquare,
  Smartphone,
  Clock,
} from 'lucide-react';

export default function ChildSafetyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <Shield className="w-10 h-10" /> Child Safety at Dheeyudha
          </h1>
          <p className="text-xl opacity-90">
            Protecting young learners while they compete and grow
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Introduction */}
        <div className="mb-16">
          <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
            At Dheeyudha, we're committed to providing a safe and respectful learning environment for all users.
            While we focus on creating an engaging platform for academic competitions, we take age-appropriate safety seriously.
          </p>
        </div>

        {/* Key Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Age Confirmation */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">Age Confirmation</h2>
            </div>
            <ul className="space-y-3 text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>All users confirm they are 14 years or older during signup</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Simple age verification checkbox to ensure appropriate user base</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Minimum age requirement aligns with most educational platforms</span>
              </li>
            </ul>
          </div>

          {/* Community Guidelines */}
          <div className="bg-purple-50 dark:bg-purple-900/20 p-8 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">Community Standards</h2>
            </div>
            <ul className="space-y-3 text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Respectful interactions encouraged across all school communities</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Users should refrain from sharing personal information</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Report inappropriate behavior to our moderation team</span>
              </li>
            </ul>
          </div>

          {/* Educational Focus */}
          <div className="bg-green-50 dark:bg-green-900/20 p-8 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">Educational Platform</h2>
            </div>
            <ul className="space-y-3 text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Focus on academics and knowledge-based competitions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>School-based squads keep communities organized and moderated</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Teachers can oversee school activities and manage students</span>
              </li>
            </ul>
          </div>

          {/* Privacy & Data */}
          <div className="bg-orange-50 dark:bg-orange-900/20 p-8 rounded-xl border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <h2 className="text-2xl font-bold text-orange-900 dark:text-orange-100">Privacy & Data</h2>
            </div>
            <ul className="space-y-3 text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>We collect minimal personal information required for the platform</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>User data is never sold to third parties</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>See our Privacy Policy for complete details</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Reporting Section */}
        <div className="bg-slate-100 dark:bg-slate-800 p-8 rounded-xl mb-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3">
            <Shield className="w-6 h-6" /> Need Help?
          </h2>
          <p className="text-slate-700 dark:text-slate-400 mb-4">
            If you have concerns about user safety or our platform, please reach out to us.
          </p>
          <a
            href="mailto:support@dheeyudha.com"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors inline-block"
          >
            Contact Us
          </a>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-50 dark:bg-slate-900 py-12 px-4 mt-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">What is the minimum age to signup?</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Users must confirm they are 14 years or older to create an account on Dheeyudha.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">What happens if I report inappropriate behavior?</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Our moderation team reviews all reports and takes appropriate action to keep the platform safe and respectful.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">How is my personal information protected?</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                We use industry-standard security measures to protect your data. We never sell or share your information with third parties.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Can I delete my account?</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Yes. You can request account deletion anytime by contacting our support team.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-blue-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Questions or Concerns?</h2>
          <p className="text-blue-100 mb-6 text-lg">
            We take your safety and privacy seriously. Feel free to reach out anytime.
          </p>
          <a
            href="mailto:support@dheeyudha.com"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-block"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
