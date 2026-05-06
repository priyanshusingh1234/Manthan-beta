'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell, Send, Copy, Check, Loader2 } from 'lucide-react';

const NOTIF_TYPES = [
  { type: 'coop_challenge',       icon: '⚔️',  label: 'Duel Challenge',        channel: 'duels',    color: '#f97316', title: '⚔️ Duel Challenge!',           body: 'Arjun challenged you to a battle on Newton\'s Laws. 24h to accept!' },
  { type: 'new_follower',         icon: '👥',  label: 'New Follower',           channel: 'social',   color: '#ec4899', title: '👥 New Follower!',              body: 'Priya Mehta started following you.' },
  { type: 'answer_approved',      icon: '✅',  label: 'Answer Approved',        channel: 'academic', color: '#10b981', title: '✅ Answer Approved!',            body: 'Your answer for "Photosynthesis" was marked correct. +10 pts!' },
  { type: 'answer_flagged',       icon: '❌',  label: 'Answer Flagged',         channel: 'academic', color: '#ef4444', title: '❌ Answer Needs Revision',      body: 'Your answer was flagged. Review teacher feedback.' },
  { type: 'points_earned',        icon: '🏆',  label: 'Points Earned',          channel: 'alerts',   color: '#f59e0b', title: '🏆 +50 Points Earned!',         body: 'You crossed 500 total points. Climbing the leaderboard! 🚀' },
  { type: 'new_question',         icon: '📚',  label: 'New Question',           channel: 'academic', color: '#6366f1', title: '📚 New Question Posted!',       body: 'Mrs. Sunita posted a Class 10 Science question — 20 pts.' },
  { type: 'streak_friend',        icon: '🔥',  label: 'Streak Friend',          channel: 'social',   color: '#f97316', title: '🔥 Rahul has a 7-day streak!',  body: "Don't let Rahul beat you — solve today's questions!" },
  { type: 'weekly_report',        icon: '📊',  label: 'Weekly Report',          channel: 'alerts',   color: '#06b6d4', title: '📊 Your Weekly Report',         body: '42 solved, 87% accuracy, 6 active days. Rating: Excellent 🌟' },
  { type: 'post_mention',         icon: '💬',  label: 'Post Mention',           channel: 'social',   color: '#3b82f6', title: '💬 You were mentioned!',        body: 'Kavya tagged you in a post 🔥' },
  { type: 'ai_confirmed_correct', icon: '🤖',  label: 'AI Correct',             channel: 'academic', color: '#10b981', title: '🤖 AI says: Correct!',          body: 'Your answer verified correct by AI. +5 XP!' },
  { type: 'ai_confirmed_wrong',   icon: '🤖',  label: 'AI Wrong',               channel: 'academic', color: '#ef4444', title: '🤖 AI says: Try again',         body: 'Your answer was incorrect. Review and retry.' },
  { type: 'chat_message',         icon: '💌',  label: 'Chat Message',           channel: 'social',   color: '#3b82f6', title: '💌 New message from Arjun',     body: 'Hey! Ready for our next duel? 😤' },
] as const;

export default function PushTestPage() {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, 'ok' | 'err'>>({});
  const [copied, setCopied] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);

      // Fetch FCM token from DB
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      // Get token from push_subscriptions via a dedicated endpoint
      const tokenRes = await fetch('/api/dev/my-fcm-token', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (tokenRes.ok) {
        const d = await tokenRes.json();
        setToken(d.token || null);
      }
    });
  }, []);

  const send = async (type: string, title: string, body: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setSending(type);
    try {
      const res = await fetch('/api/dev/send-test-notif', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, title, body }),
      });
      setResults(r => ({ ...r, [type]: res.ok ? 'ok' : 'err' }));
    } catch {
      setResults(r => ({ ...r, [type]: 'err' }));
    } finally {
      setSending(null);
    }
  };

  const sendAll = async () => {
    setSendingAll(true);
    for (const t of NOTIF_TYPES) {
      await send(t.type, t.title, t.body);
      await new Promise(r => setTimeout(r, 2500));
    }
    setSendingAll(false);
  };

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: '#6366f1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Push Notification Tester</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Dev only — fire test notifications</div>
          </div>
        </div>

        {/* FCM Token card */}
        <div style={{ background: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 20, border: '1px solid #334155' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Your FCM Token</div>
          {token ? (
            <>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8', wordBreak: 'break-all', lineHeight: 1.6, marginBottom: 10 }}>
                {token.slice(0, 60)}…
              </div>
              <button onClick={copyToken} style={{ display: 'flex', alignItems: 'center', gap: 6, background: copied ? '#10b981' : '#334155', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy Full Token'}
              </button>
              <div style={{ fontSize: 10, color: '#475569', marginTop: 8 }}>
                Paste this in Firebase Console → Cloud Messaging → Send test message
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 700 }}>
              ❌ No FCM token registered. Open the app on Android and allow notifications first.
            </div>
          )}
        </div>

        {/* Send all button */}
        <button
          onClick={sendAll}
          disabled={sendingAll || !token}
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: sendingAll ? '#334155' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', color: '#fff', fontWeight: 900, fontSize: 14,
            cursor: sendingAll || !token ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 16, opacity: !token ? 0.4 : 1,
          }}
        >
          {sendingAll ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
          {sendingAll ? 'Sending all… (2.5s each)' : '🚀 Send All Test Notifications'}
        </button>

        {/* Individual buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {NOTIF_TYPES.map(t => (
            <button
              key={t.type}
              onClick={() => send(t.type, t.title, t.body)}
              disabled={!!sending || !token}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12,
                background: results[t.type] === 'ok' ? '#052e16' : results[t.type] === 'err' ? '#1c0000' : '#1e293b',
                border: `1px solid ${results[t.type] === 'ok' ? '#10b981' : results[t.type] === 'err' ? '#ef4444' : '#334155'}`,
                cursor: sending || !token ? 'not-allowed' : 'pointer',
                opacity: !token ? 0.4 : 1,
                textAlign: 'left', width: '100%',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: t.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {t.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9' }}>{t.label}</div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{t.channel} channel</div>
              </div>
              {sending === t.type ? (
                <Loader2 size={14} color="#64748b" style={{ animation: 'spin 1s linear infinite' }} />
              ) : results[t.type] === 'ok' ? (
                <span style={{ fontSize: 11, color: '#10b981', fontWeight: 900 }}>✓ Sent</span>
              ) : results[t.type] === 'err' ? (
                <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 900 }}>✗ Failed</span>
              ) : (
                <Send size={14} color="#475569" />
              )}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 24, fontSize: 10, color: '#334155', textAlign: 'center', fontWeight: 600 }}>
          This page is dev-only. Remove before full public launch.
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
