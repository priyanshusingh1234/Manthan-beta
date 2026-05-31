'use client';

import React from 'react';
import { Link } from 'expo-router';
import {
  Shield,
  Lock,
  Users,
  CheckCircle,
  Eye,
  MessageSquare,
  ChevronRight,
} from 'lucide-react-native';

export default function ChildSafetyPage() {
  return (
    <View className="min-h-screen bg-slate-50">
      <View className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <View className="mb-6">
          <Text className="text-2xl sm:text-3xl font-semibold text-slate-900">Child Safety</Text>
          <Text className="mt-2 text-sm sm:text-base text-slate-600">
            How we protect minors on Dheeyudha.
          </Text>
        </View>

        <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <View className="px-4 sm:px-5 py-4 border-b border-slate-100">
            <Text className="text-sm text-slate-700">
              We keep the platform educational, respectful, and age-appropriate.
            </Text>
          </View>

          <View className="p-4 sm:p-5 space-y-3">
            <View className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <View className="flex items-center gap-2 mb-2 text-slate-900 font-medium flex-row">
                <Eye className="w-4 h-4 text-blue-600" /> Age confirmation
              </View>
              <View className="space-y-2 text-sm text-slate-700">
                <View className="flex items-start gap-2 flex-row">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  Users confirm they are 14+ during signup.
                </View>
                <View className="flex items-start gap-2 flex-row">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  Accounts are expected to follow age requirements.
                </View>
              </View>
            </View>

            <View className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <View className="flex items-center gap-2 mb-2 text-slate-900 font-medium flex-row">
                <Users className="w-4 h-4 text-violet-600" /> Community standards
              </View>
              <View className="space-y-2 text-sm text-slate-700">
                <View className="flex items-start gap-2 flex-row">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  Respectful behavior is required.
                </View>
                <View className="flex items-start gap-2 flex-row">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  Do not share personal contact information.
                </View>
              </View>
            </View>

            <View className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <View className="flex items-center gap-2 mb-2 text-slate-900 font-medium flex-row">
                <MessageSquare className="w-4 h-4 text-emerald-600" /> Education first
              </View>
              <View className="space-y-2 text-sm text-slate-700">
                <View className="flex items-start gap-2 flex-row">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  Platform features are focused on learning and competition.
                </View>
                <View className="flex items-start gap-2 flex-row">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  School and teacher structure helps maintain discipline.
                </View>
              </View>
            </View>

            <View className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <View className="flex items-center gap-2 mb-2 text-slate-900 font-medium flex-row">
                <Lock className="w-4 h-4 text-amber-600" /> Privacy
              </View>
              <View className="space-y-2 text-sm text-slate-700">
                <View className="flex items-start gap-2 flex-row">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  We collect only required account data.
                </View>
                <View className="flex items-start gap-2 flex-row">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  We do not sell user data.
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-4 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <Link
            href="/privacy"
            className="flex items-center justify-between px-4 sm:px-5 py-4 hover:bg-slate-50 transition-colors flex-row"
          >
            <View className="flex items-center gap-2 text-slate-900 font-medium flex-row">
              <Shield className="w-4 h-4 text-blue-600" /> Privacy Policy
            </View>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>

          <a
            href="mailto:kpk22128@gmail.com"
            className="flex items-center justify-between px-4 sm:px-5 py-4 border-t border-slate-100 hover:bg-slate-50 transition-colors flex-row"
          >
            <View className="text-slate-900 font-medium">Contact support</View>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>
        </View>

        <View className="mt-4 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <Text className="text-base font-semibold text-slate-900 mb-3">FAQ</Text>
          <View className="space-y-3 text-sm text-slate-700">
            <View>
              <Text className="font-medium text-slate-900">Minimum age?</Text>
              <Text>Users must confirm they are 14 years or older.</Text>
            </View>
            <View>
              <Text className="font-medium text-slate-900">How to report issues?</Text>
              <Text>Use the in-app report option or contact support directly.</Text>
            </View>
            <View>
              <Text className="font-medium text-slate-900">Can I delete my account?</Text>
              <Text>Yes, account deletion can be requested from settings/support.</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
