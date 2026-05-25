"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Calendar, Trophy, Users, Share2, CheckCircle, UserPlus } from 'lucide-react';
import { Share } from '@capacitor/share';

interface Participant {
  id: number;
  name: string;
}

export default function PoetryCompetition() {
  const [hasParticipated, setHasParticipated] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/poetry-participants')
      .then(res => res.json())
      .then(data => {
        setParticipants(data);
        const participated = localStorage.getItem('hasParticipatedPoetry');
        if (participated) {
          setHasParticipated(true);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch participants', err);
        setLoading(false);
      });
  }, []);

  const handleParticipate = async () => {
    if (!hasParticipated) {
      setHasParticipated(true);
      localStorage.setItem('hasParticipatedPoetry', 'true');
      
      const newParticipant = { id: Date.now(), name: 'You' };
      // Optimistic update
      setParticipants(prev => [...prev, newParticipant]);

      try {
        await fetch('/api/poetry-participants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newParticipant),
        });
      } catch (err) {
        console.error('Failed to save participant', err);
      }
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Grand Poetry Face-off',
        text: 'Join me in the Grand Poetry Face-off competition!',
        url: window.location.href,
        dialogTitle: 'Share with buddies',
      });
    } catch (error) {
      console.error('Error sharing natively:', error);
      // Fallback for web if Capacitor Share isn't available or fails
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Grand Poetry Face-off',
            text: 'Join me in the Grand Poetry Face-off competition!',
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(window.location.href);
          alert('Link copied to clipboard!');
        }
      } catch (fallbackError) {
        console.error('Error sharing via fallback:', fallbackError);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="p-2 -ml-2 mr-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </Link>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Poetry Competition
            </h1>
          </div>
          <button
            onClick={handleShare}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">Share</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 mt-8 space-y-6">
        <div className="bg-gradient-to-br from-rose-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
            <Sparkles className="w-48 h-48" />
          </div>
          <h2 className="text-3xl font-extrabold mb-4 relative z-10">The Grand Poetry Face-off</h2>
          <p className="text-lg text-purple-100 mb-6 relative z-10">
            Unleash your creativity and show the community your poetic brilliance!
          </p>
          <div className="flex flex-wrap gap-4 relative z-10 mb-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Day After Tomorrow</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="font-medium">Open to All Users</span>
            </div>
          </div>
          
          <div className="relative z-10">
            <button
              onClick={handleParticipate}
              disabled={hasParticipated}
              className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                hasParticipated
                  ? 'bg-white/20 text-white cursor-default'
                  : 'bg-white text-purple-600 hover:bg-purple-50 active:scale-95'
              }`}
            >
              {hasParticipated ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                  You're Participating!
                </>
              ) : (
                <>
                  <UserPlus className="w-6 h-6" />
                  Participate Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Participants List */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Participants ({participants.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <div
                key={p.id}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  p.name === 'You'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {p.name}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            How to Participate
          </h3>

          <ul className="space-y-6">
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">Write your Masterpiece</h4>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Draft your original poetry. It can be on any topic, but creativity is key! Use your best rhymes, emotions, and thoughts.
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">Post in the Community</h4>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Go to the home feed or community tab and create a new post with your poem.
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">Tag the Judges</h4>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Make sure to mention <span className="font-bold text-indigo-500">harsh</span> or <span className="font-bold text-indigo-500">priyanshu</span> in your post so we can find your entry!
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">Win Big Prizes!</h4>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  The winners will be decided based on creativity and community engagement (likes/comments), and will receive exclusive league points and special recognition!
                </p>
              </div>
            </li>
          </ul>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
            <Link href="/" className="block w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-center rounded-2xl font-bold shadow-md transition-transform active:scale-95 text-lg">
              Go to Feed to Post Now
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
