import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
'use client';

import { Link } from 'expo-router';
import { Mail, ShieldCheck, Trash2, Clock3, ArrowRight, MessageCircleQuestion } from 'lucide-react-native';

export default function DeleteAccountPage() {
  const supportEmail = 'kpk22128@gmail.com';

  const steps = [
    'Send us a deletion request from your account email address.',
    'We verify ownership and confirm the account you want deleted.',
    'We permanently remove your account and associated personal data, subject to legal or security retention requirements.',
  ];

  return (
    <View className="min-h-screen bg-[#f2f4f7] text-slate-900">
      <View className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6 sm:px-6">
        <View
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-7"
        >
          <View className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <View className="max-w-2xl">
              <View className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-rose-700 flex-row">
                <Trash2 className="h-3.5 w-3.5" />
                Account Deletion
              </View>
              <Text className="text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">Delete your Dheeyudha account</Text>
              <Text className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                You can request permanent deletion of your account and personal data from this page. If you prefer, you can also email us directly and we will process the request after verifying ownership.
              </Text>
            </View>

            <a
              href={`mailto:${supportEmail}?subject=Account%20Deletion%20Request&body=Hello%20Dheeyudha%20team,%0A%0AI%20want%20to%20delete%20my%20account.%20Please%20process%20my%20request.%0A%0AMy%20email%20is%3A%20`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] active:scale-95 flex-row"
            >
              <Mail className="h-4 w-4" />
              Email request
            </a>
          </View>

          <View className="mt-8 grid gap-3 lg:grid-cols-3">
            {steps.map((step, index) => (
              <View key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <View className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700 flex-row">
                  <Text className="text-sm font-black">0{index + 1}</Text>
                </View>
                <Text className="text-sm leading-6 text-slate-700">{step}</Text>
              </View>
            ))}
          </View>

          <View className="mt-6 grid gap-3 md:grid-cols-2">
            <View className="rounded-2xl border border-slate-200 bg-white p-4">
              <View className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900 flex-row">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                What gets deleted
              </View>
              <View className="space-y-2 text-sm leading-6 text-slate-700">
                <View>• Your account profile and login access</View>
                <View>• Public-facing personal account data stored by Dheeyudha</View>
                <View>• App content tied to your account, where technically feasible</View>
              </View>
            </View>

            <View className="rounded-2xl border border-slate-200 bg-white p-4">
              <View className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900 flex-row">
                <Clock3 className="h-4 w-4 text-amber-600" />
                Processing time
              </View>
              <Text className="text-sm leading-6 text-slate-700">
                We aim to complete deletion requests within 7 days. If we need additional verification, we may contact you first. Some records may be retained for legal, security, or fraud-prevention obligations.
              </Text>
            </View>
          </View>

          <View className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <View className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <View>
                <View className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-900 flex-row">
                  <MessageCircleQuestion className="h-4 w-4 text-sky-600" />
                  Need help?
                </View>
                <Text className="text-sm leading-6 text-slate-700">
                  Contact us at <a className="font-semibold text-sky-700 hover:underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>.
                </Text>
              </View>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition-transform hover:scale-[1.01] active:scale-95 flex-row">
                Contact page
                <ArrowRight className="h-4 w-4" />
              </Link>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
