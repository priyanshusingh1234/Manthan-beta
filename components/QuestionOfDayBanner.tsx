'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, FlaskConical, Timer, ArrowRight } from 'lucide-react';

type ApiQuestion = {
  id: string;
  title: string;
  body?: string | null;
  subject?: string | null;
  classGrade?: string | number | null;
  points?: number | null;
  difficulty?: string | null;
  timeLimit?: number | null;
};

function normalize(v?: string | null) {
  return String(v || '').trim().toLowerCase();
}

function dateSeed() {
  const d = new Date();
  return Number(`${d.getUTCFullYear()}${d.getUTCMonth() + 1}${d.getUTCDate()}`);
}

export default function QuestionOfDayBanner() {
  const [items, setItems] = useState<ApiQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetch('/api/questions?subject=Science&limit=120', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setItems(Array.isArray(data?.questions) ? data.questions : []);
      })
      .catch(() => {
        if (!mounted) return;
        setItems([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const qotd = useMemo(() => {
    const eligible = items.filter((q) => {
      const subjectOk = normalize(q.subject) === 'science';
      const classOk = String(q.classGrade || '') === '10';
      const hardOk = normalize(q.difficulty) === 'hard';
      const marksOk = Number(q.points || 0) >= 20;
      return subjectOk && classOk && hardOk && marksOk;
    });

    if (!eligible.length) return null;
    return eligible[dateSeed() % eligible.length];
  }, [items]);

  return (
    <section className="mx-auto mt-4 max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 via-cyan-50 to-blue-50 p-5 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/40 dark:via-cyan-950/30 dark:to-blue-950/30 sm:p-6">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/20" />

        <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/70 bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:border-emerald-700 dark:bg-slate-900/70 dark:text-emerald-300">
            <CalendarDays className="h-3.5 w-3.5" />
            Question of the Day
          </div>

          {loading ? (
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Loading today&apos;s challenge...</p>
          ) : qotd ? (
            <>
              <h2 className="text-lg font-black text-slate-900 dark:text-white sm:text-2xl">
                Class 10 Science Challenge: {qotd.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 dark:bg-slate-900/80">
                  <FlaskConical className="h-3.5 w-3.5" /> Hard
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-slate-900/80">20 Marks</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 dark:bg-slate-900/80">
                  <Timer className="h-3.5 w-3.5" /> {qotd.timeLimit || 10} min
                </span>
              </div>
              {qotd.body && (
                <p className="line-clamp-2 text-sm font-medium text-slate-700 dark:text-slate-300">{qotd.body}</p>
              )}
              <Link
                href={`/questions/${qotd.id}`}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-500"
              >
                Solve now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              No Class 10 Science hard challenge is available yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
