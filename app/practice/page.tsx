"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChevronRight, BookOpen, Search, X } from 'lucide-react';
import Link from 'next/link';

const CATEGORY_COLORS: Record<string, { bg: string; icon: string }> = {
  'Science':   { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-500' },
  'Maths':     { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'text-green-500' },
  'SST':       { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-500' },
  'English':   { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-500' },
  'Hindi':     { bg: 'bg-rose-50 dark:bg-rose-900/20', icon: 'text-rose-500' },
  'Hindi Gr':  { bg: 'bg-rose-50 dark:bg-rose-900/20', icon: 'text-rose-500' },
};

export default function PracticeIndexScreen() {
  const [sections, setSections] = useState<{ title: string; data: string[] }[]>([]);
  const [filtered, setFiltered] = useState<{ title: string; data: string[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [classGrade, setClassGrade] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const res = await fetch(`/api/practice/chapters`, { headers });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setClassGrade(data.classGrade);

        const secs = Object.entries(data.categories as Record<string, string[]>).map(
          ([title, chapters]) => ({ title, data: chapters })
        );
        setSections(secs);
        setFiltered(secs);
      } catch (e: any) {
        setError(e.message || 'Failed to load chapters');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearch(text);
    if (!text.trim()) {
      setFiltered(sections);
      return;
    }
    const q = text.toLowerCase();
    const result = sections
      .map(sec => ({ ...sec, data: sec.data.filter(ch => ch.toLowerCase().includes(q)) }))
      .filter(sec => sec.data.length > 0);
    setFiltered(result);
  }, [sections]);

  const clearSearch = () => {
    setSearch('');
    setFiltered(sections);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28 pt-8">
      {/* Header */}
      <div className="px-6 py-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Practice Mode
          </h1>
          {classGrade && (
            <div className="bg-indigo-600 rounded-full px-3 py-1">
              <span className="text-white font-bold text-xs">Class {classGrade}</span>
            </div>
          )}
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          Choose a chapter to start practising all questions
        </p>

        {/* Search */}
        <div className="flex items-center gap-3 mt-6 bg-white dark:bg-slate-900 rounded-2xl px-4 py-3 border border-slate-200 dark:border-slate-800 shadow-sm focus-within:ring-2 ring-indigo-500/20 transition-all">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            className="flex-1 bg-transparent text-slate-900 dark:text-white outline-none placeholder:text-slate-400 font-medium text-sm"
            placeholder="Search chapters..."
            value={search}
            onChange={handleSearch}
          />
          {search.length > 0 && (
            <button onClick={clearSearch}>
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold">Loading chapters...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-5xl mb-4">😕</div>
            <p className="text-red-500 font-bold text-center">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-slate-500 font-bold">No chapters found</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filtered.map((section, idx) => {
              const colors = CATEGORY_COLORS[section.title] || { bg: 'bg-slate-100 dark:bg-slate-800', icon: 'text-slate-500' };
              
              return (
                <div key={`${section.title}-${idx}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-1.5 h-5 rounded-full bg-current ${colors.icon}`} />
                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 tracking-wide">
                      {section.title}
                    </h2>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 ml-2" />
                    <span className="text-xs font-bold text-slate-400">
                      {section.data.length} chapters
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.data.map((chapter) => (
                      <Link
                        key={chapter}
                        href={`/practice/${encodeURIComponent(chapter)}`}
                        className="flex items-center bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-md transition-all group"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${colors.bg}`}>
                          <BookOpen className={`w-5 h-5 ${colors.icon}`} />
                        </div>
                        <span className="flex-1 text-slate-700 dark:text-slate-200 font-bold text-sm leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {chapter}
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
