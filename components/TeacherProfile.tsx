"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { type Area } from 'react-easy-crop';
import CropModal from '@/components/profile/CropModal';
import EditProfileModal from '@/components/profile/EditProfileModal';
import { getCroppedImg, blobToFile } from '@/utils/cropImage';
import { compressImage } from '@/utils/compressImage';
import {
  Trophy, Target, Award, Zap, BookOpen, Users, TrendingUp,
  Star, Medal, Brain, Sword, Shield, Pencil, Check, X
} from 'lucide-react';
import Image from 'next/image';
import TeacherBadge from '@/ticks/teacher';
import FollowButton from '@/components/FollowButton';
import TeacherReviewPanel from '@/components/TeacherReviewPanel';
import MyPostsSection from '@/components/MyPostsSection';


const TeacherProfile: React.FC = () => {
  const [userData, setUserData] = useState({
    name: 'Guest',
    school: '',
    subject: '',
    bio: '',
    avatar: '🧠',
    rank: '',
    rankNumber: '',
    totalRank: '',
    username: '',
    usernameUpdates: [] as number[],
  });

  const [statsData, setStatsData] = useState({ averageRating: 0, totalReviews: 0 });

  const stats = [
    { icon: BookOpen, label: 'Questions Posted', value: '34', color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
    { icon: Users, label: 'Students Reached', value: '1.2k', color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { icon: Star, label: 'Average Rating', value: statsData.averageRating > 0 ? statsData.averageRating.toFixed(1) : 'New', color: 'text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { icon: Trophy, label: 'Total Reviews', value: statsData.totalReviews.toString(), color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  const achievements = [
    { icon: BookOpen, title: 'First Post', description: 'Posted your first question', earned: true },
    { icon: Users, title: 'Influencer', description: 'Reached 1000 students', earned: true },
    { icon: Star, title: 'Highly Rated', description: 'Received 500 upvotes', earned: true },
    { icon: Brain, title: 'Subject Expert', description: 'Top contributor in subject', earned: false },
    { icon: Award, title: 'Top 10 Teacher', description: 'Ranked in top 10 globally', earned: false },
    { icon: Medal, title: 'Veteran Educator', description: '1 Year anniversary', earned: false },
  ];

  const recentBattles = [
    { title: 'Algebraic Expressions test', points: 10, views: '156', date: '2 hours ago' },
    { title: 'Newton\'s Laws of Motion', points: 25, views: '320', date: '1 day ago' },
    { title: 'World War 2 History Quiz', points: 15, views: '89', date: '2 days ago' },
  ];

  // Editable profile state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', username: '', school: '', subject: '', bio: '' });
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'achievements' | 'posts'>('achievements');

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      setCurrentUser(user || null);
      if (user) {
        const meta = user.user_metadata || {};
        const metaFullName = typeof meta.fullName === 'string' ? meta.fullName : undefined;
        const metaUsername = typeof meta.username === 'string' ? meta.username : '';
        const metaAvatar = (typeof meta.avatar_url === 'string' ? meta.avatar_url : undefined) || (typeof meta.picture === 'string' ? meta.picture : undefined);
        const metaBio = typeof meta.bio === 'string' ? meta.bio : undefined;

        setEditForm({
          name: metaFullName || user.email || '',
          username: metaUsername,
          school: meta.school || '',
          subject: meta.mainSubject || meta.main_subject || '',
          bio: meta.bio || ''
        });

        setUserData((s) => ({
          ...s,
          name: metaFullName || user.email || 'User',
          school: meta.school || s.school,
          subject: meta.mainSubject || meta.main_subject || s.subject,
          bio: meta.bio || s.bio,
          avatar: metaAvatar || s.avatar,
          username: metaUsername,
          usernameUpdates: Array.isArray(meta.username_updates) ? meta.username_updates : []
        }));

        supabase.from('teacher_stats').select('average_rating, total_reviews').eq('teacher_id', user.id).maybeSingle().then(({ data }) => {
          if (mounted && data) {
            setStatsData({
              averageRating: Number(data.average_rating) || 0,
              totalReviews: Number(data.total_reviews) || 0
            });
          }
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const uploadToStorage = async (bucket: string, path: string, file: File) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const form = new FormData();
    form.append('file', file);
    form.append('bucket', bucket);
    form.append('path', path);

    const res = await fetch('/api/profile/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form
    });

    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Upload failed');

    return { publicUrl: body.publicUrl, path: body.path };
  };

  // Cropping modal state
  const [showCrop, setShowCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropType, setCropType] = useState<'avatar' | 'banner'>('avatar');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onCropComplete = useCallback((_: Area, croppedAreaPixelsLocal: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsLocal);
  }, []);

  const openCropForFile = async (f: File, type: 'avatar' | 'banner') => {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      setMessage('File must be <= 8MB');
      return;
    }
    const url = URL.createObjectURL(f);
    setSelectedFile(f);
    setImageSrc(url);
    setCropType(type);
    setShowCrop(true);
  };

  const performUpload = async (fileToUpload: File, type: 'avatar' | 'banner') => {
    if (!currentUser) return;
    if (avatarUploading || bannerUploading) {
        setMessage('Upload already in progress...');
        return;
    }

    const bucket = type === 'avatar' ? 'avatars' : 'banners';
    const path = `${type}s/${currentUser.id}/${type}_${Date.now()}.webp`;
    let oldPath = currentUser.user_metadata?.[`${type}_path`];
    const urlKey = `${type}_url`;
    const maybeUrl = currentUser.user_metadata?.[urlKey] as string | undefined;
    if (!oldPath && maybeUrl && typeof maybeUrl === 'string') {
      try {
        const m = maybeUrl.match(/\/storage\/v1\/object\/public\/(?:[^\/]+)\/(.+)$/);
        if (m && m[1]) oldPath = decodeURIComponent(m[1]);
      } catch {
        // ignore parse errors
      }
    }
    try {
      if (type === 'avatar') setAvatarUploading(true);
      else setBannerUploading(true);

      setMessage(`Uploading ${type}...`);
      // Compress before uploading
      const compressed = await compressImage(fileToUpload, type === 'avatar' ? 'avatar' : 'banner');

      const { publicUrl, path: newPath } = (await uploadToStorage(
        bucket,
        path,
        compressed
      )) as { publicUrl: string; path: string };

      const updateData: Record<string, unknown> = {};
      updateData[`${type}_url`] = publicUrl;
      updateData[`custom_${type}_url`] = publicUrl;
      updateData[`${type}_path`] = newPath;

      await supabase.auth.updateUser({ data: updateData });

      // Await the sync so the profiles table is guaranteed to have the latest
      // avatar_url before we return — prevents stale data on /user/[username]
      // and on the leaderboard for the rest of this request lifecycle.
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
          await fetch('/api/profile/sync', {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}` }
          }).catch(console.error);
      }

      if (type === 'avatar') setUserData((s) => ({ ...s, avatar: publicUrl }));
      else setUserData((s) => ({ ...s }));
      setMessage(`${type[0].toUpperCase() + type.slice(1)} updated`);

      // Proactively update local cache to prevent flickering/stale views in Feed
      if (typeof window !== 'undefined') {
          const currentMeta = currentUser.user_metadata || {};
          const newMeta = { ...currentMeta, ...updateData };
          localStorage.setItem('dheeyudha_user_meta_cache', JSON.stringify(newMeta));
          // Dispatch a custom event so other components (like QuestionsFeed) can update instantly
          window.dispatchEvent(new Event('user_metadata_updated'));
      }

      if (oldPath) {
        const token = session?.access_token;
        const delRes = await fetch('/api/profile/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ bucket, path: oldPath })
        });
        if (!delRes.ok) {
          const errData = await delRes.json();
          console.warn('Failed to remove old storage file:', errData.error);
        }
      }

      try {
        const { data: refreshed } = await supabase.auth.getUser();
        setCurrentUser(refreshed.user || null);
      } catch (e) {
        console.warn('Failed to refresh user after upload', e);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage(msg || 'Upload failed');
    } finally {
      setAvatarUploading(false);
      setBannerUploading(false);
      setShowCrop(false);
    }
  };

  const onCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels || !selectedFile) return;
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!blob) throw new Error('Crop failed');
      const file = blobToFile(blob, `${cropType}_${Date.now()}.png`);
      setSelectedFile(null);
      await performUpload(file, cropType);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage(msg || 'Crop/upload failed');
      setShowCrop(false);
    }
  };

  useEffect(() => {
    if (!showCrop && imageSrc) {
      try {
        URL.revokeObjectURL(imageSrc);
      } catch {
        /* ignore */
      }
      setImageSrc(null);
    }
  }, [showCrop, imageSrc]);

  const handleAvatarChange = async (f: File | null) => {
    if (!f || !currentUser) return;
    await openCropForFile(f, 'avatar');
  };

  const handleBannerChange = async (f: File | null) => {
    if (!f || !currentUser) return;
    await openCropForFile(f, 'banner');
  };

  const saveProfile = async () => {
    if (!currentUser) return;

    let newUsernameUpdates = userData.usernameUpdates;

    if (editForm.username !== userData.username) {
      if (editForm.username.length < 3) {
        setMessage('Username must be at least 3 characters');
        return;
      }
      if (/[A-Z]/.test(editForm.username)) {
        setMessage('Username cannot contain uppercase letters');
        return;
      }
      if (/\s/.test(editForm.username)) {
        setMessage('Username cannot contain spaces');
        return;
      }

      const updates = (userData.usernameUpdates || []) as number[];
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const recentUpdates = updates.filter(ts => ts > thirtyDaysAgo);

      if (recentUpdates.length >= 4) {
        setMessage('Limit reached: 4 username updates/month');
        return;
      }

      setMessage('Checking username availability...');
      const uniqueCheckRes = await fetch(`/api/check-username?username=${encodeURIComponent(editForm.username)}`);
      if (uniqueCheckRes.ok) {
        const uniqueCheckData = await uniqueCheckRes.json();
        if (!uniqueCheckData.isUnique) {
          setMessage('Username is already taken');
          return;
        }
      }
      newUsernameUpdates = [...recentUpdates, now];
    }

    try {
      setMessage('Saving profile...');
      const { error } = await supabase.auth.updateUser({
        data: {
          fullName: editForm.name,
          username: editForm.username,
          username_updates: newUsernameUpdates,
          school: editForm.school,
          mainSubject: editForm.subject,
          bio: editForm.bio
        }
      });

      if (error) throw error;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
          fetch('/api/profile/sync', {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}` }
          }).catch(console.error);
      }

      setUserData((s) => ({
        ...s,
        name: editForm.name,
        username: editForm.username,
        usernameUpdates: newUsernameUpdates,
        school: editForm.school,
        subject: editForm.subject,
        bio: editForm.bio
      }));
      setShowEditProfile(false);
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage(msg || 'Update failed');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 relative pb-20">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-transparent bg-center opacity-20 pointer-events-none" />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Crop Modal */}
        {showCrop && imageSrc && (
          <CropModal
            imageSrc={imageSrc}
            crop={crop}
            zoom={zoom}
            cropType={cropType}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onSave={onCropSave}
            onCancel={() => setShowCrop(false)}
          />
        )}

        {/* Edit Profile Modal */}
        {showEditProfile && (
          <EditProfileModal
            form={{ name: editForm.name, username: editForm.username, school: editForm.school, grade: editForm.subject, bio: editForm.bio, showWeeklyReport: true }}
            message={message}
            onFormChange={(f) => setEditForm({ ...editForm, name: f.name, username: f.username, school: f.school, subject: f.grade, bio: f.bio })}
            onSave={saveProfile}
            onClose={() => setShowEditProfile(false)}
          />
        )}
        {/* Profile Header */}
        <div className="relative z-20 mt-16 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden mb-12 border border-slate-100 dark:border-slate-800">
          <div className="h-44 sm:h-64 relative group shadow-inner">
            {currentUser?.user_metadata?.banner_url ? (
              <div className="absolute inset-0">
                <Image
                  src={currentUser.user_metadata.banner_url}
                  alt="banner"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
            )}

            {/* subtle divider/shadow at banner bottom to separate from card */}
            <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none bg-gradient-to-b from-transparent to-white/90 dark:to-slate-900/60" />

            <label className="absolute right-4 top-4 cursor-pointer opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 shadow-lg hover:bg-white dark:hover:bg-slate-700">
                {bannerUploading ? 'Uploading…' : 'Change Banner'}
              </span>
              <input
                id="banner-upload"
                accept="image/*"
                type="file"
                className="hidden"
                disabled={bannerUploading}
                onChange={(ev) => handleBannerChange(ev.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="px-5 sm:px-8 pb-8 relative mt-0 sm:mt-0">
            {/* Top Row: Avatar and Stats - Instagram Style */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-10">
              
              {/* Avatar Section */}
              <div className="flex items-center sm:items-start gap-6 sm:gap-8 w-full sm:w-auto -mt-10 sm:-mt-20">
                <div className="relative group shrink-0 z-10">
                  <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 sm:border-[6px] border-white dark:border-slate-900 shadow-2xl bg-white dark:bg-slate-800">
                    {typeof userData.avatar === 'string' && userData.avatar.startsWith('http') ? (
                      <Image
                        src={userData.avatar}
                        alt="avatar"
                        width={144}
                        height={144}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl sm:text-6xl">
                        {userData.avatar}
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-1 left-1/2 -translate-x-1/2 cursor-pointer opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full text-[10px] font-black shadow-lg text-slate-700 dark:text-slate-300">
                      {avatarUploading ? '…' : <Pencil className="w-3 h-3" />}
                    </span>
                    <input
                      id="avatar-upload"
                      accept="image/*"
                      type="file"
                      className="hidden"
                      disabled={avatarUploading}
                      onChange={(ev) => handleAvatarChange(ev.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
                
                {/* Mobile-only Stats */}
                <div className="flex-1 sm:hidden">
                   {currentUser && <FollowButton profileUserId={currentUser.id} />}
                </div>
              </div>

              {/* User Identity Section */}
              <div className="flex-1 text-left z-10">
                {message && (
                  <div className="mb-4 inline-block px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-bold shadow-sm">
                    {message}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">
                       {userData.name}
                       {currentUser?.user_metadata?.isTeacher && <TeacherBadge />}
                    </h1>
                  </div>
                  <p className="text-slate-500 text-sm font-bold tracking-tight">@{userData.username || 'username'}</p>
                </div>

                <div className="mt-4 flex flex-col gap-1">
                  <p className="text-slate-700 dark:text-slate-300 text-sm font-bold">
                    {userData.school || 'Academic Professional'} • {userData.subject || 'Subject Specialist'}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-xl">
                    {userData.bio || 'Inspiring students to reach their full potential 🚀'}
                  </p>
                </div>

                {/* Actions Row */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowEditProfile(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl transition-all active:scale-95 text-sm"
                  >
                    Edit Profile
                  </button>
                  {/* Desktop Stats (Hidden on mobile) */}
                  <div className="hidden sm:block">
                    {currentUser && <FollowButton profileUserId={currentUser.id} />}
                  </div>
                </div>
              </div>
           </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 relative z-10">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 group hover:-translate-y-2 transition-all duration-300 border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-2xl"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-slate-100 to-transparent dark:from-slate-800 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>

              <div className={`${stat.bgColor} w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border border-white/20 shadow-sm relative z-10 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-7 h-7 ${stat.color} drop-shadow-sm`} />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1 relative z-10 drop-shadow-sm">{stat.value}</div>
              <div className="text-sm font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase relative z-10">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mb-8 relative z-10">
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative overflow-hidden">
            <div
              className={`absolute top-1 bottom-1 w-1/2 rounded-xl bg-white dark:bg-slate-700 shadow-sm transition-transform duration-300 ${activeTab === 'posts' ? 'translate-x-full' : 'translate-x-0'}`}
            />
            <button
              onClick={() => setActiveTab('achievements')}
              className={`relative z-10 px-5 py-2.5 text-sm font-black rounded-xl transition-colors ${activeTab === 'achievements' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Achievements
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`relative z-10 px-5 py-2.5 text-sm font-black rounded-xl transition-colors ${activeTab === 'posts' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
            >
              My Posts
            </button>
          </div>
        </div>

        {/* Two Column Layout */}
        {activeTab === 'achievements' && (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          {/* Achievements */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-900/40 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-inner group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6 text-blue-600 dark:text-blue-400 drop-shadow-sm" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Achievements</h2>
            </div>
            <div className="space-y-4">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`flex items-center p-5 rounded-2xl border transition-all duration-300 ${achievement.earned
                    ? 'border-transparent bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/50 hover:-translate-y-1'
                    : 'border-slate-100 dark:border-slate-800 bg-transparent opacity-60'
                    }`}
                >
                  <div
                    className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center mr-5 shadow-sm ${achievement.earned
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-blue-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                      }`}
                  >
                    <achievement.icon className="w-7 h-7 drop-shadow-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">{achievement.title}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{achievement.description}</p>
                  </div>
                  {achievement.earned && (
                    <div className="shrink-0 ml-4">
                      <div className="w-8 h-8 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center shadow-sm">
                        <Check className="w-5 h-5 text-emerald-600" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Questions */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-blue-500 to-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-inner group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400 drop-shadow-sm" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Recent Questions</h2>
            </div>
            <div className="space-y-4">
              {recentBattles.map((battle, index) => (
                <div
                  key={index}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 group/battle cursor-pointer"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/40 rounded-xl shadow-inner group-hover/battle:scale-105 transition-transform border border-indigo-100 dark:border-indigo-800">
                      <Sword className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover/battle:text-indigo-600 transition-colors">{battle.title}</h3>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{battle.points} Points • {battle.views} Views</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end text-sm font-bold text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                    <span>{battle.date}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-2xl transition-all duration-300 active:scale-95 border border-slate-200 dark:border-slate-700 shadow-sm">
              View All Questions
            </button>
          </div>
        </div>

        {/* Teaching Impact */}
        <div className="mt-8 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm p-8 sm:p-10 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors pointer-events-none"></div>

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-900/40 rounded-2xl border border-emerald-100 dark:border-emerald-800 shadow-inner group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400 drop-shadow-sm" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Teaching Impact</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none hover:-translate-y-1 transition-transform group/card">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 dark:border-blue-800 group-hover/card:scale-110 transition-transform">
                <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-xs mb-2">Engagement Rate</h3>
              <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">84<span className="text-2xl text-slate-400">%</span></div>
              <div className="mt-6 bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full w-[84%]" />
              </div>
            </div>

            <div className="p-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl border border-emerald-400 shadow-xl shadow-emerald-500/30 hover:-translate-y-1 transition-transform group/card text-white relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 border border-white/30 group-hover/card:scale-110 transition-transform backdrop-blur-sm">
                <Users className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              <h3 className="font-bold text-emerald-100 uppercase tracking-widest text-xs mb-2">Total Participants</h3>
              <div className="text-5xl font-black text-white tracking-tight">1,245</div>
              <p className="text-sm font-medium text-emerald-50 mt-4 bg-black/20 px-4 py-2 rounded-xl inline-block border border-white/10 backdrop-blur-md">Across all questions</p>
            </div>

            <div className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none hover:-translate-y-1 transition-transform group/card">
              <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 border border-purple-100 dark:border-purple-800 group-hover/card:scale-110 transition-transform">
                <Star className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-xs mb-2">Upvotes & Likes</h3>
              <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700">856</div>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-4 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-xl inline-block border border-emerald-100 dark:border-emerald-800">Top 5% of Educators</p>
            </div>
          </div>
        </div>
        </>
        )}

        {activeTab === 'posts' && <MyPostsSection />}

        {/* Flagged Written Submissions Review Panel */}
        <div className="mt-8 relative z-10">
          <TeacherReviewPanel />
        </div>
      </main >
    </div >
  );
};

export default TeacherProfile;