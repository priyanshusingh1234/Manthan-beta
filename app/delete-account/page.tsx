'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ShieldCheck, Trash2, Clock3, ArrowRight, MessageCircleQuestion } from 'lucide-react';

export default function DeleteAccountPage() {
  const supportEmail = 'kpk22128@gmail.com';

  const steps = [
    'Send us a deletion request from your account email address.',
    'We verify ownership and confirm the account you want deleted.',
    'We permanently remove your account and associated personal data, subject to legal or security retention requirements.',
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-5 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-[32px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur-2xl sm:p-10"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-rose-200">
                <Trash2 className="h-3.5 w-3.5" />
                Account Deletion
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Delete your Dheeyudha account</h1>
              <p className="mt-4 text-sm leading-7 text-white/70 sm:text-base">
                You can request permanent deletion of your account and personal data from this page. If you prefer, you can also email us directly and we will process the request after verifying ownership.
              </p>
            </div>

            <a
              href={`mailto:${supportEmail}?subject=Account%20Deletion%20Request&body=Hello%20Dheeyudha%20team,%0A%0AI%20want%20to%20delete%20my%20account.%20Please%20process%20my%20request.%0A%0AMy%20email%20is%3A%20`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition-transform hover:scale-[1.01] active:scale-95"
            >
              <Mail className="h-4 w-4" />
              Email request
            </a>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step} className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                  <span className="text-sm font-black">0{index + 1}</span>
                </div>
                <p className="text-sm leading-6 text-white/75">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                What gets deleted
              </div>
              <ul className="space-y-2 text-sm leading-6 text-white/70">
                <li>• Your account profile and login access</li>
                <li>• Public-facing personal account data stored by Dheeyudha</li>
                <li>• App content tied to your account, where technically feasible</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                <Clock3 className="h-4 w-4 text-amber-300" />
                Processing time
              </div>
              <p className="text-sm leading-6 text-white/70">
                We aim to complete deletion requests within 7 days. If we need additional verification, we may contact you first. Some records may be retained for legal, security, or fraud-prevention obligations.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-bold text-white">
                  <MessageCircleQuestion className="h-4 w-4 text-sky-300" />
                  Need help?
                </div>
                <p className="text-sm leading-6 text-white/70">
                  Contact us at <a className="font-semibold text-cyan-300 hover:underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>.
                </p>
              </div>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.01] active:scale-95">
                Contact page
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
