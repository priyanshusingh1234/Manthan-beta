import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import { Link } from 'expo-router';
import {
  Shield, Lock, Database, Share2, UserX, Bell,
  Globe, Eye, Trash2, Mail, ChevronRight, CheckCircle2
} from 'lucide-react-native';

export const metadata = {
  title: 'Privacy Policy — Dheeyudha',
  description: 'Learn how Dheeyudha collects, uses, and protects your personal data.',
};

const LAST_UPDATED = 'April 21, 2026';

const sections = [
  { id: 'overview', label: 'Overview', icon: Shield },
  { id: 'data-collect', label: 'Data We Collect', icon: Database },
  { id: 'how-we-use', label: 'How We Use Your Data', icon: Eye },
  { id: 'third-parties', label: 'Third-Party Services', icon: Share2 },
  { id: 'data-security', label: 'Data Security', icon: Lock },
  { id: 'public-data', label: 'Public Information', icon: Globe },
  { id: 'your-rights', label: 'Your Rights & Choices', icon: UserX },
  { id: 'cookies', label: 'Cookies & Storage', icon: Bell },
  { id: 'contact', label: 'Contact Us', icon: Mail },
];

function SectionHeading({ id, icon: Icon, children }: { id: string; icon: any; children: React.ReactNode }) {
  return (
    <View id={id} className="flex items-center gap-3 mb-5 scroll-mt-10 flex-row">
      <View className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0 flex-row">
        <Icon className="w-5 h-5 text-white" />
      </View>
      <Text className="text-2xl font-black text-slate-900">{children}</Text>
    </View>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-slate-600 leading-relaxed text-[15px]">
      {children}
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View className="space-y-2.5 mt-3">
      {items.map((item, i) => (
        <View key={i} className="flex items-start gap-2.5 text-[15px] text-slate-600 flex-row">
          <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <Text>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function PrivacyPage() {
  return (
    <View className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
      {/* ── Layout ── */}
      <View className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <View className="flex gap-10 flex-row">

          {/* ── Sticky Sidebar ── */}
          <View className="hidden lg:block w-56 shrink-0">
            <View className="sticky top-10 bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-sm p-4 space-y-1">
              <Text className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 mb-3">Contents</Text>
              {sections.map(({ id, label, icon: Icon }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 transition-all group flex-row"
                >
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                  <Text className="truncate">{label}</Text>
                  <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </View>
          </View>

          {/* ── Content ── */}
          <View className="flex-1 min-w-0 space-y-14 flex-row">

            {/* ── TL;DR Summary ── */}
            <View className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-7">
              <Text className="font-black text-indigo-800 text-lg mb-4 flex items-center gap-2 flex-row">
                <Zap className="w-5 h-5 text-indigo-500" /> TL;DR — The Short Version
              </Text>
              <View className="grid sm:grid-cols-2 gap-3">
                {[
                  'We only collect data necessary to run the platform.',
                  'We never sell your personal data to third parties.',
                  'Passwords are hashed — we never see them in plain text.',
                  'You can delete your account and data at any time.',
                  'We use Supabase (EU-compliant) for auth & storage.',
                  'Profile information you post publicly is visible to all.',
                ].map((item, i) => (
                  <View key={i} className="flex items-start gap-2 text-sm text-indigo-700 flex-row">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <Text>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 1. Overview */}
            <View>
              <SectionHeading id="overview" icon={Shield}>Overview</SectionHeading>
              <InfoCard>
                <Text>
                  Dheeyudha ("we", "our", or "us") is an educational quiz platform that connects students and
                  verified teachers for academic learning and competitive quizzes. This Privacy Policy explains how
                  we collect, use, store, and protect information in connection with your use of Dheeyudha at{' '}
                  <Text className="font-semibold text-indigo-600">Dheeyudha.app</Text> and related services.
                </Text>
                <Text className="mt-4">
                  By creating an account or using Dheeyudha, you agree to the practices described in this policy.
                  If you do not agree, please discontinue use of the service and visit our{' '}
                  <Link href="/delete-account" className="font-semibold text-indigo-600 hover:underline">
                    account deletion page
                  </Link>{' '}
                  to request deletion.
                </Text>
                <Text className="mt-4">
                  This policy applies to all users — students, teachers, and visitors — regardless of how they
                  access Dheeyudha (web browser, mobile device, etc.).
                </Text>
              </InfoCard>
            </View>

            {/* 2. Data We Collect */}
            <View>
              <SectionHeading id="data-collect" icon={Database}>Data We Collect</SectionHeading>
              <View className="space-y-4">
                <InfoCard>
                  <Text className="font-bold text-slate-800 mb-3">2.1 Account Information</Text>
                  <Text>When you register, we collect:</Text>
                  <BulletList items={[
                    'Full name (as provided during signup)',
                    'Email address (used for authentication and communication)',
                    'Password (stored as a secure bcrypt hash — never in plain text)',
                    'Username (unique, lowercase, no spaces — public identifier)',
                    'User role: student or verified teacher',
                  ]} />
                </InfoCard>

                <InfoCard>
                  <Text className="font-bold text-slate-800 mb-3">2.2 Profile Information (Optional)</Text>
                  <Text>You may optionally add:</Text>
                  <BulletList items={[
                    'School name and class grade',
                    'A biography / bio text',
                    'Profile avatar image (uploaded to our storage)',
                    'Banner / cover image',
                    'Teacher-specific: primary teaching subject',
                  ]} />
                  <Text className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    ⚠️ Profile information you provide is <Text>publicly visible</Text> to all users and visitors unless noted otherwise.
                  </Text>
                </InfoCard>

                <InfoCard>
                  <Text className="font-bold text-slate-800 mb-3">2.3 Usage & Activity Data</Text>
                  <BulletList items={[
                    'Questions you attempt and scores you achieve',
                    'Quiz battles you participate in (opponents, outcomes, timestamps)',
                    'Questions created by teachers (title, body, subject, options)',
                    'Follow relationships (who you follow and who follows you)',
                    'Profile interactions (avatar updates, username change timestamps)',
                  ]} />
                </InfoCard>

                <InfoCard>
                  <Text className="font-bold text-slate-800 mb-3">2.4 Technical Data</Text>
                  <BulletList items={[
                    'Browser type and device information (for compatibility)',
                    'IP address (logged by Supabase for security purposes)',
                    'Session tokens and JWT authentication data',
                    'Storage paths for uploaded files (avatars, banners, question images)',
                  ]} />
                </InfoCard>
              </View>
            </View>

            {/* 3. How We Use */}
            <View>
              <SectionHeading id="how-we-use" icon={Eye}>How We Use Your Data</SectionHeading>
              <InfoCard>
                <Text className="mb-4">We use your information strictly for the following purposes:</Text>
                <View className="grid sm:grid-cols-2 gap-4">
                  {[
                    { title: 'Authentication', desc: 'Verifying your identity on login, managing sessions, and keeping your account secure.' },
                    { title: 'Profile Display', desc: 'Showing your name, avatar, bio, and stats on your public profile to other users.' },
                    { title: 'Leaderboard', desc: 'Calculating and displaying your global ranking based on points earned from quiz attempts.' },
                    { title: 'Quiz Battles', desc: 'Matching you in real-time competitive quizzes, recording outcomes, and awarding points.' },
                    { title: 'Follow System', desc: 'Enabling you to follow teachers and students and view their follower/following counts.' },
                    { title: 'Rate Limiting', desc: 'Tracking username update timestamps to enforce the 4-per-month limit and prevent abuse.' },
                    { title: 'Teacher Verification', desc: 'Reviewing teacher applications and associating verified teachers with posted questions.' },
                    { title: 'Platform Safety', desc: 'Detecting and preventing abuse, spam, and policy violations.' },
                  ].map(({ title, desc }) => (
                    <View key={title} className="flex gap-3 flex-row">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-1 shrink-0" />
                      <View>
                        <View className="font-bold text-slate-800 text-sm">{title}</View>
                        <View className="text-slate-500 text-sm leading-relaxed">{desc}</View>
                      </View>
                    </View>
                  ))}
                </View>
                <Text className="mt-5 text-sm text-slate-500 italic">We do <Text>not</Text> use your data for advertising, profiling, or selling to third parties.</Text>
              </InfoCard>
            </View>

            {/* 4. Third Parties */}
            <View>
              <SectionHeading id="third-parties" icon={Share2}>Third-Party Services</SectionHeading>
              <View className="space-y-4">
                {[
                  {
                    name: 'Supabase',
                    role: 'Authentication, Database & Storage',
                    desc: 'We use Supabase to manage user authentication, store application data (profiles, questions, follows, scores), and host uploaded files (avatars, banners). Supabase is SOC2-compliant and stores data in secure cloud infrastructure.',
                    link: 'https://supabase.com/privacy',
                    linkLabel: 'Supabase Privacy Policy',
                    badge: 'Core Infrastructure',
                    badgeColor: 'bg-green-100 text-green-700',
                  },
                  {
                    name: 'Vercel / Next.js',
                    role: 'Web Hosting & Delivery',
                    desc: 'Dheeyudha is hosted on Vercel, which serves the web application globally. Vercel may collect standard web server logs (IP addresses, timestamps, request paths) as part of their infrastructure.',
                    link: 'https://vercel.com/legal/privacy-policy',
                    linkLabel: 'Vercel Privacy Policy',
                    badge: 'Hosting',
                    badgeColor: 'bg-slate-100 text-slate-700',
                  },
                  {
                    name: 'Google Firebase',
                    role: 'Push Notifications & Messaging',
                    desc: 'We use Firebase Cloud Messaging (FCM) to deliver real-time notifications (e.g. follows, chat messages). This involves processing anonymous device tokens to route messages to your mobile device.',
                    link: 'https://firebase.google.com/support/privacy',
                    linkLabel: 'Firebase Privacy Policy',
                    badge: 'Notifications',
                    badgeColor: 'bg-orange-100 text-orange-700',
                  },
                ].map(service => (
                  <InfoCard key={service.name}>
                    <View className="flex items-start justify-between gap-4 mb-3 flex-row">
                      <View>
                        <Text className="font-bold text-slate-800 text-base">{service.name}</Text>
                        <Text className="text-xs text-slate-500 font-medium">{service.role}</Text>
                      </View>
                      <Text className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${service.badgeColor}`}>{service.badge}</Text>
                    </View>
                    <Text className="text-sm leading-relaxed">{service.desc}</Text>
                    <a href={service.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 text-sm font-semibold hover:underline mt-3 flex-row">
                      Read {service.linkLabel} →
                    </a>
                  </InfoCard>
                ))}
                <View className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-600">
                  We do <Text>not</Text> share your personal data with advertisers, data brokers, or any other third parties beyond the infrastructure providers listed above.
                </View>
              </View>
            </View>

            {/* 5. Security */}
            <View>
              <SectionHeading id="data-security" icon={Lock}>Data Security</SectionHeading>
              <InfoCard>
                <Text className="mb-5">We take security seriously and have implemented multiple layers of protection:</Text>
                <View className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: '🔐', title: 'Hashed Passwords', desc: 'Passwords are hashed using bcrypt via Supabase Auth. We never store or see plaintext passwords.' },
                    { icon: '🛡️', title: 'Row-Level Security (RLS)', desc: 'Every database table uses Supabase RLS policies. Users can only access their own records with rare, defined exceptions.' },
                    { icon: '🔑', title: 'JWT Authentication', desc: 'All authenticated requests use short-lived signed JWT tokens. Tokens are rotated on every session refresh.' },
                    { icon: '🗄️', title: 'Private Admin Operations', desc: 'Server-side operations use a service-role key never exposed to browsers. Client keys are scoped to only what the user needs.' },
                    { icon: '📁', title: 'Secure File Storage', desc: 'Avatars and images are stored in Supabase Storage buckets with controlled access policies. Raw bucket paths are never exposed.' },
                    { icon: '🌐', title: 'HTTPS Everywhere', desc: 'All data in transit is encrypted using TLS/HTTPS. There is no unencrypted HTTP access to the platform.' },
                  ].map(({ icon, title, desc }) => (
                    <View key={title} className="flex gap-3 bg-slate-50 rounded-xl p-3 flex-row">
                      <Text className="text-2xl">{icon}</Text>
                      <View>
                        <View className="font-bold text-slate-800 text-sm">{title}</View>
                        <View className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</View>
                      </View>
                    </View>
                  ))}
                </View>
                <Text className="mt-5 text-sm text-slate-500">
                  While we implement strong security measures, no system is 100% infallible. We encourage users to use strong, unique passwords and to report any suspicious activity to us immediately.
                </Text>
              </InfoCard>
            </View>

            {/* 6. Public Data */}
            <View>
              <SectionHeading id="public-data" icon={Globe}>Public Information</SectionHeading>
              <InfoCard>
                <Text className="mb-4">Some of the information you provide is visible to all users and visitors of Dheeyudha — even without an account. This includes:</Text>
                <BulletList items={[
                  'Your display name and username (e.g. /user/your-username)',
                  'Your profile avatar and banner image',
                  'Your bio / biography text',
                  'Your school name and class grade (if provided)',
                  'Your global rank and point total (on the leaderboard)',
                  'Your followers count and following count',
                  'Questions posted by teachers (title, body, subject, difficulty)',
                  'Achievements and badges earned on your profile',
                ]} />
                <View className="mt-5 bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800">
                  ⚠️ <Text>Be mindful:</Text> Do not include sensitive personal information (phone numbers, physical addresses, financial data) in your bio or profile fields. These fields are publicly visible.
                </View>
              </InfoCard>
            </View>

            {/* 7. Your Rights */}
            <View>
              <SectionHeading id="your-rights" icon={UserX}>Your Rights & Choices</SectionHeading>
              <View className="space-y-4">
                <InfoCard>
                  <Text className="font-bold text-slate-800 mb-3">Access & Correction</Text>
                  <Text>You can view and edit most of your personal information directly on your profile page at <Link href="/profile" className="text-indigo-600 font-semibold hover:underline">/profile</Link>. This includes your name, username, bio, avatar, and banner.</Text>
                </InfoCard>

                <InfoCard>
                  <Text className="font-bold text-slate-800 mb-3">Username Changes</Text>
                  <Text>You may update your username up to <Text>4 times per 30-day period</Text> from your profile page. This limit helps maintain the integrity of @mentions and profile links across the platform.</Text>
                </InfoCard>

                <InfoCard>
                  <Text className="font-bold text-slate-800 mb-3 flex items-center gap-2 flex-row">
                    <Trash2 className="w-4 h-4 text-red-400" /> Account Deletion
                  </Text>
                  <BulletList items={[
                    'Use the "Delete Account" button in your App Settings.',
                    'Or contact us at the email listed in the Contact section below.',
                    'Account deletion requests are processed manually within 14 business days.',
                    'Note: some data (quiz outcomes, posted questions) may be retained in anonymised form for platform integrity.',
                  ]} />
                </InfoCard>

                <InfoCard>
                  <Text className="font-bold text-slate-800 mb-3">Objection & Restriction</Text>
                  <Text>If you believe we are processing your data unlawfully or incorrectly, you have the right to object. Please contact us and we will review your request promptly.</Text>
                </InfoCard>
              </View>
            </View>

            {/* 8. Cookies */}
            <View>
              <SectionHeading id="cookies" icon={Bell}>Cookies & Local Storage</SectionHeading>
              <InfoCard>
                <Text className="mb-4">Dheeyudha uses minimal browser storage to function properly:</Text>
                <View className="overflow-hidden rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="text-left px-4 py-3 font-bold text-slate-700">Type</th>
                        <th className="text-left px-4 py-3 font-bold text-slate-700">Purpose</th>
                        <th className="text-left px-4 py-3 font-bold text-slate-700">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                      {[
                        ['Auth Session Cookie', 'Keeps you logged in across page visits', 'Until sign out'],
                        ['JWT Access Token', 'Authenticates API requests securely', '1 hour (auto-refreshed)'],
                        ['Refresh Token', 'Obtains a new access token silently', '30 days'],
                        ['localStorage (UI)', 'Saves light UI preferences like sidebar state', 'Browser session'],
                      ].map(([type, purpose, duration]) => (
                        <tr key={type} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-800">{type}</td>
                          <td className="px-4 py-3 text-slate-600">{purpose}</td>
                          <td className="px-4 py-3 text-slate-500">{duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </View>
                <Text className="mt-4 text-sm text-slate-500">We do <Text>not</Text> use tracking cookies, advertising cookies, or third-party analytics cookies.</Text>
              </InfoCard>
            </View>

            {/* 9. Contact */}
            <View>
              <SectionHeading id="contact" icon={Mail}>Contact Us</SectionHeading>
              <InfoCard>
                <Text className="mb-5">If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please reach out:</Text>
                <View className="grid sm:grid-cols-2 gap-4">
                  <View className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                    <View className="font-bold text-indigo-800 mb-1 text-sm">💌 Email</View>
                    <a href="mailto:kpk22128@gmail.com" className="text-indigo-600 font-semibold hover:underline text-sm">
                      kpk22128@gmail.com
                    </a>
                    <Text className="text-xs text-indigo-500 mt-1">We aim to respond within 2 business days.</Text>
                  </View>
                  <View className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                    <View className="font-bold text-slate-700 mb-1 text-sm">📝 Contact Form</View>
                    <Link href="/contact" className="text-indigo-600 font-semibold hover:underline text-sm">
                      Dheeyudha.app/contact
                    </Link>
                    <Text className="text-xs text-slate-400 mt-1">Use our contact page for general queries.</Text>
                  </View>
                </View>
              </InfoCard>
            </View>

            {/* Footer note */}
            <View className="text-center py-8 border-t border-slate-100">
              <Text className="text-slate-500 text-sm">This policy was last updated on <Text>{LAST_UPDATED}</Text>.</Text>
              <Text className="text-slate-400 text-xs mt-1">Changes to this policy will be communicated via email or a prominent notice on the platform.</Text>
              <View className="flex justify-center gap-4 mt-5 flex-row">
                <Link href="/docs" className="text-indigo-600 text-sm font-semibold hover:underline">Docs</Link>
                <Link href="/contact" className="text-indigo-600 text-sm font-semibold hover:underline">Contact</Link>
                <Link href="/about" className="text-indigo-600 text-sm font-semibold hover:underline">About</Link>
              </View>
            </View>

          </View>
        </View>
      </View>
    </View>
  );
}

// Inline helper — avoids an extra import just for the TL;DR section
function Zap({ className }: { className?: string }) {
  return (
    <Check className="w-5 h-5 text-gray-500" />
  );
}
