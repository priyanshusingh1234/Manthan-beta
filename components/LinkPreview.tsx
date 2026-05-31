'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, HelpCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// Validates host-like values with optional path for protocol-less links (e.g. example.com/posts/123).
const DOMAIN_WITH_OPTIONAL_PATH_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+(?:\/.*)?$/;
const MAX_PREVIEW_LENGTH = 80;

export default function LinkPreview({ url }: { url: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchMeta() {
      try {
        const trimmedUrl = url.trim();
        let parsedUrl: URL;
        if (trimmedUrl.startsWith('/')) {
          parsedUrl = new URL(trimmedUrl, typeof window !== 'undefined' ? window.location.origin : 'https://manthan-beta-c975.vercel.app');
        } else if (/^https?:\/\//i.test(trimmedUrl)) {
          parsedUrl = new URL(trimmedUrl);
        } else if (DOMAIN_WITH_OPTIONAL_PATH_REGEX.test(trimmedUrl)) {
          parsedUrl = new URL(`https://${trimmedUrl}`);
        } else {
          parsedUrl = new URL(trimmedUrl, 'https://manthan-beta-c975.vercel.app');
        }

        const path = parsedUrl.pathname;
        const segments = path.split('/').filter(Boolean);
        const postIdx = segments.indexOf('posts');
        const questionIdx = segments.indexOf('questions');

        if (postIdx !== -1) {
          const postId = segments[postIdx + 1];
          if (!postId) throw new Error('Invalid post ID');

          const { data: post, error } = await supabase
            .from('posts')
            .select('content, author_id, image_url')
            .eq('id', postId)
            .single();

          if (error || !post) throw error;

          let authorName = 'Scholar';
          let authorAvatar = null;
          
          if (post.author_id) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', post.author_id)
                .maybeSingle();
                
            if (profile) {
              authorName = profile.full_name || 'Scholar';
              authorAvatar = profile.avatar_url;
            }
          }

          setData({
            type: 'post',
            title: 'Community Post',
            description: post.content
              ? `${post.content.slice(0, MAX_PREVIEW_LENGTH)}${post.content.length > MAX_PREVIEW_LENGTH ? '...' : ''}`
              : 'Open this community post.',
            image: post.image_url,
            authorName,
            authorAvatar,
            link: `/posts/${postId}`
          });
        } else if (questionIdx !== -1) {
          const qId = segments[questionIdx + 1];
          if (!qId) throw new Error('Invalid question ID');

          const { data: q, error } = await supabase
            .from('questions')
            .select('title, subject, points, image_url, image_path')
            .eq('id', qId)
            .single();

          if (error || !q) throw error;

          let qImage = q.image_url;
          if (!qImage && q.image_path) {
            const { data: publicUrlData } = supabase.storage.from('question-images').getPublicUrl(q.image_path);
            qImage = publicUrlData.publicUrl;
          }

          setData({
            type: 'question',
            title: q.title || 'Question Challenge',
            description: `Subject: ${q.subject} • ${q.points} Points`,
            image: qImage,
            link: `/questions/${qId}`
          });
        } else {
          setError(true); // not an internal URL we care about
        }
      } catch (err) {
        console.error("LinkPreview error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchMeta();
  }, [url]);

  if (error) return null; // Fallback to raw text link in parent if not recognized

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 mt-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        <span className="text-xs text-slate-500">Loading preview...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <Link href={data.link} className="block mt-2 max-w-[280px] group select-none">
      <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700">
        {data.image && (
          <div className="w-full h-32 relative bg-slate-100 dark:bg-slate-900 overflow-hidden border-b border-slate-100 dark:border-slate-700">
            <Image src={data.image} alt="Preview" fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
          </div>
        )}
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            {data.type === 'post' ? <FileText className="w-3.5 h-3.5 text-indigo-500" /> : <HelpCircle className="w-3.5 h-3.5 text-orange-500" />}
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {data.type === 'post' ? 'Community Post' : 'Challenge'}
            </span>
          </div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight mb-1 truncate">
            {data.title}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {data.description}
          </p>
          {data.authorName && (
            <div className="flex items-center gap-1.5 mt-2.5">
              {data.authorAvatar ? (
                <Image src={data.authorAvatar} alt="" width={16} height={16} className="rounded-full object-cover w-4 h-4 bg-slate-200" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-[8px] font-bold text-indigo-600">
                  {data.authorName[0]}
                </div>
              )}
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                {data.authorName}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
