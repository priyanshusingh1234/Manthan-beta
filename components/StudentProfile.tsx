"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { type Area } from 'react-easy-crop';
import { getCroppedImg, blobToFile } from '@/utils/cropImage';
import { compressImage } from '@/utils/compressImage';
import {
  Trophy, Target, Award, Zap, BookOpen, Users, TrendingUp,
  Star, Medal, Brain, Sword, Shield, Pencil, Check, X, CheckCircle2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import TeacherBadge from '@/ticks/teacher';
import TopperBadge from '@/ticks/topper';
import { GoldBadge, SilverBadge, BronzeBadge } from '@/ticks/RankBadges';
import BadgedName from '@/components/BadgedName';
import FollowButton from '@/components/FollowButton';
import CropModal from '@/components/profile/CropModal';
import EditProfileModal from '@/components/profile/EditProfileModal';
import MyPostsSection from '@/components/MyPostsSection';
import { useTopRanks } from '@/hooks/useTopRanks';

type BadgeKey = 'gold' | 'silver' | 'bronze' | 'topper';

const MAX_EQUIPPED_BADGES = 3;

const StudentProfile: React.FC = () => {
  const { getRank } = useTopRanks();
  const [userData, setUserData] = useState({
    name: 'Guest',
    school: '',
    grade: '',
    bio: '',
    avatar: '🧠',
    rank: '',
    rankNumber: '',
    totalRank: '',
    username: '',
    usernameUpdates: [] as number[],
    totalPoints: 0,
    battlesAttempted: 0,
    battlesWon: 0,
    showWeeklyReport: true,
  });

  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(true);

  const winRate = userData.battlesAttempted > 0 ? Math.round((userData.battlesWon / userData.battlesAttempted) * 100) : 0;

  const stats = [
    { icon: Trophy, label: 'Battles Won', value: userData.battlesWon.toString(), color: 'text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { icon: Target, label: 'Win Rate', value: `${winRate}%`, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20' },
    { icon: Zap, label: 'Battles Taken', value: userData.battlesAttempted.toString(), color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
    { icon: Star, label: 'Points', value: userData.totalPoints.toLocaleString(), color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  ];

  const achievements = [
    { icon: Medal, title: 'First Victory', description: 'Won your first battle', earned: true },
    { icon: Sword, title: 'Battle Master', description: 'Won 100 battles', earned: true },
    { icon: Brain, title: 'Quiz Genius', description: 'Perfect score in 10 quizzes', earned: true },
    { icon: Shield, title: 'Streak Warrior', description: '30-day win streak', earned: false },
    { icon: Award, title: 'Top 50', description: 'Ranked in top 50 globally', earned: true },
    { icon: Users, title: 'School Champion', description: 'Top scorer in your school', earned: false },
  ];

  const [recentBattles, setRecentBattles] = useState<any[]>([]);
  const [loadingSolved, setLoadingSolved] = useState(true);

  // Editable profile state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const profileUserId = currentUser?.id;
  const profileRank = profileUserId ? getRank(profileUserId) : null;
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', username: '', school: '', grade: '', bio: '', showWeeklyReport: true });
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'achievements' | 'posts' | 'badges'>('achievements');
  const [equippedBadges, setEquippedBadges] = useState<BadgeKey[]>([]);
  const [equipSaving, setEquipSaving] = useState(false);

  const availableBadges: Array<{ key: BadgeKey; title: string; description: string; earned: boolean }> = [
    {
      key: 'gold',
      title: 'Rank #1 Champion',
      description: 'Holding the crown as the smartest mind in Dheeyudha.',
      earned: profileRank === 1,
    },
    {
      key: 'silver',
      title: 'Rank #2 Elite',
      description: 'One of the elite minds competing for the top spot.',
      earned: profileRank === 2,
    },
    {
      key: 'bronze',
      title: 'Rank #3 Pro',
      description: 'A seasoned warrior in the top tier of students.',
      earned: profileRank === 3,
    },
    {
      key: 'topper',
      title: 'Lifetime Topper',
      description: 'Awarded for achieving over 1,500 lifetime points in battles.',
      earned: userData.totalPoints >= 1500,
    },
  ];

  const earnedBadges = availableBadges.filter((badge) => badge.earned);
  const lockedBadges = availableBadges.filter((badge) => !badge.earned);

  const renderBadgeIcon = (badgeKey: BadgeKey) => {
    if (badgeKey === 'gold') return <GoldBadge />;
    if (badgeKey === 'silver') return <SilverBadge />;
    if (badgeKey === 'bronze') return <BronzeBadge />;
    return <TopperBadge />;
  };

  const sanitizeBadgeList = (list: unknown): BadgeKey[] => {
    if (!Array.isArray(list)) return [];
    return list.filter((item): item is BadgeKey => ['gold', 'silver', 'bronze', 'topper'].includes(String(item)));
  };

  const saveEquippedBadges = async (nextBadges: BadgeKey[]) => {
    if (!currentUser) return false;

    try {
      setEquipSaving(true);
      const { error } = await supabase.auth.updateUser({
        data: {
          equipped_badges: nextBadges,
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

      return true;
    } catch (err) {
      console.error('Failed to save equipped badges', err);
      setMessage('Could not save badge selection. Please try again.');
      return false;
    } finally {
      setEquipSaving(false);
    }
  };

  const toggleEquipBadge = async (badgeKey: BadgeKey) => {
    const target = availableBadges.find((badge) => badge.key === badgeKey);
    if (!target?.earned || equipSaving) return;

    const currentlyEquipped = equippedBadges.includes(badgeKey);
    const nextBadges = currentlyEquipped
      ? equippedBadges.filter((key) => key !== badgeKey)
      : [...equippedBadges, badgeKey];

    if (!currentlyEquipped && nextBadges.length > MAX_EQUIPPED_BADGES) {
      setMessage(`You can equip up to ${MAX_EQUIPPED_BADGES} badges.`);
      return;
    }

    const previous = equippedBadges;
    setEquippedBadges(nextBadges);

    const ok = await saveEquippedBadges(nextBadges);
    if (!ok) {
      setEquippedBadges(previous);
      return;
    }

    setMessage(currentlyEquipped ? 'Badge unequipped' : 'Badge equipped');
    setTimeout(() => setMessage(''), 1800);
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (!session?.user) return;
      const user = session.user;
      setCurrentUser(user);

      // Async fetch fresh user to catch newly bought cosmetics without blocking initial render
      supabase.auth.getUser().then(({ data: fUser }) => {
          if (fUser?.user && mounted) setCurrentUser(fUser.user);
      });

      // ── Step 1: Render immediately from metadata (instant) ──
      const meta = user.user_metadata || {};
      const metaFullName = typeof meta.fullName === 'string' ? meta.fullName : undefined;
      const metaUsername = typeof meta.username === 'string' ? meta.username : '';
      const metaAvatar = typeof meta.avatar_url === 'string' ? meta.avatar_url : undefined;
      const metaBio = typeof meta.bio === 'string' ? meta.bio : undefined;
      const metaEquippedBadges = sanitizeBadgeList(meta.equipped_badges || meta.equippedBadges);

      setEditForm({
        name: metaFullName || user.email || '',
        username: metaUsername,
        school: meta.school || '',
        grade: meta.classGrade || '',
        bio: metaBio || '',
        showWeeklyReport: meta.showWeeklyReport !== false
      });
      setUserData((s) => ({
        ...s,
        name: metaFullName || user.email || 'User',
        school: meta.school || s.school,
        grade: meta.classGrade || s.grade,
        bio: metaBio || s.bio,
        avatar: metaAvatar || s.avatar,
        username: metaUsername,
        usernameUpdates: Array.isArray(meta.username_updates) ? meta.username_updates : [],
        totalPoints: Number(meta.totalPoints) || 0,
        battlesAttempted: Number(meta.battlesAttempted) || 0,
        battlesWon: Number(meta.battlesWon) || 0,
        showWeeklyReport: meta.showWeeklyReport !== false,
      }));
      setEquippedBadges(metaEquippedBadges);

      // ── Step 2: Force-sync auth metadata → DB (ensures DB has latest points) ──
      try {
        await fetch('/api/profile/sync', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
      } catch { /* non-blocking */ }

      // ── Step 3: Read fresh from DB (guaranteed current after sync) ──
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (dbProfile && mounted) {
        // Use the MAX of meta vs DB points — never show a lower number
        const freshPoints = Math.max(Number(meta.totalPoints) || 0, Number(dbProfile.total_points) || 0);
        setUserData((s) => ({
          ...s,
          name: dbProfile.full_name || s.name,
          school: dbProfile.school || s.school,
          bio: dbProfile.bio || s.bio,
          avatar: dbProfile.avatar_url || s.avatar,
          username: dbProfile.username || s.username,
          totalPoints: freshPoints,
          battlesAttempted: Number(dbProfile.battles_attempted) || Number(meta.battlesAttempted) || 0,
          battlesWon: Number(dbProfile.battles_won) || Number(meta.battlesWon) || 0,
        }));
        setEditForm({
          name: dbProfile.full_name || metaFullName || '',
          username: dbProfile.username || metaUsername || '',
          school: dbProfile.school || meta.school || '',
          grade: dbProfile.class_grade || meta.classGrade || '',
          bio: dbProfile.bio || metaBio || '',
          showWeeklyReport: meta.showWeeklyReport !== false
        });
      }
    });
    // Fetch real solved questions & weekly report
    const fetchSolvedAndReport = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const res = await fetch('/api/questions/solved', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setRecentBattles(data);
          }
          
          const repRes = await fetch('/api/report', {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
            cache: 'no-store'
          });
          if (repRes.ok) {
            setWeeklyReport(await repRes.json());
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoadingSolved(false);
        setLoadingReport(false);
      }
    };
    fetchSolvedAndReport();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const earnedKeys = new Set(earnedBadges.map((badge) => badge.key));
    const sanitized = equippedBadges.filter((key) => earnedKeys.has(key));
    if (sanitized.length !== equippedBadges.length) {
      setEquippedBadges(sanitized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileRank, userData.totalPoints]);

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

      // Compress before uploading
      const compressed = await compressImage(fileToUpload, type === 'avatar' ? 'avatar' : 'banner');

      const { publicUrl, path: newPath } = (await uploadToStorage(
        bucket,
        path,
        compressed
      )) as { publicUrl: string; path: string };

      const updateData: Record<string, unknown> = {};
      updateData[`${type}_url`] = publicUrl;
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

      if (oldPath) {
        const { data: { session } } = await supabase.auth.getSession();
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
    }
  };

  const onCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels || !selectedFile) return;
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!blob) throw new Error('Crop failed');
      const file = blobToFile(blob, `${cropType}_${Date.now()}.png`);
      setShowCrop(false);
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
          classGrade: editForm.grade,
          bio: editForm.bio,
          showWeeklyReport: editForm.showWeeklyReport
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
        grade: editForm.grade,
        bio: editForm.bio,
        showWeeklyReport: editForm.showWeeklyReport
      }));
      setShowEditProfile(false);
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage(msg || 'Update failed');
    }
  };

  // Calculate Analytics for UI
  const subjectCounts: Record<string, number> = {};
  const teacherCounts: Record<string, number> = {};
  recentBattles.forEach(q => {
    if (q.subject) subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
    if (q.createdByName) teacherCounts[q.createdByName] = (teacherCounts[q.createdByName] || 0) + 1;
  });
  const sortedSubjects = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]);
  const favSubject = sortedSubjects.length > 0 ? sortedSubjects[0][0] : 'Exploring';

  const sortedTeachers = Object.entries(teacherCounts).sort((a, b) => b[1] - a[1]);
  const favTeacher = sortedTeachers.length > 0 ? sortedTeachers[0][0] : 'Various';

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 relative pb-20">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-transparent bg-center opacity-20 pointer-events-none" />

      <main className="relative max-w-7xl mx-auto sm:px-6 lg:px-8 py-4 sm:py-8">
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
            form={editForm}
            message={message}
            onFormChange={setEditForm}
            onSave={saveProfile}
            onClose={() => setShowEditProfile(false)}
          />
        )}

        {/* Profile Header - Native mobile look */}
        <div className="relative z-20 mt-8 sm:mt-16 bg-white dark:bg-slate-900 rounded-t-[3rem] sm:rounded-[2.5rem] shadow-[0_-15px_30px_-5px_rgba(0,0,0,0.1)] sm:shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mb-8 sm:mb-12 border-t sm:border border-slate-100 dark:border-slate-800 transition-all duration-300">
          <div className="h-40 sm:h-64 relative group shadow-inner transition-all duration-500">
            {currentUser?.user_metadata?.banner_url ? (
              <div className="absolute inset-0 scale-105">
                <Image
                  src={currentUser.user_metadata.banner_url}
                  alt="banner"
                  fill
                  className="object-cover opacity-90"
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
                onChange={(ev) => handleBannerChange(ev.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <div className="px-5 sm:px-8 pb-8 relative">
            {/* Top Row: Avatar + Stats (mobile), Avatar + Info + Rank (desktop) */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-8">
              
              {/* Avatar Section */}
              <div className="flex items-center sm:items-start gap-6 sm:gap-0 w-full sm:w-auto -mt-10 sm:-mt-20">
                <div className="relative group shrink-0 z-10">
                  {currentUser?.user_metadata?.cosmetics?.includes('avatar_glow') && (
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-xl opacity-70 animate-pulse transition-opacity"></div>
                  )}
                  <div className={`relative w-24 h-24 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 sm:border-[5px] shadow-2xl bg-white dark:bg-slate-800 transition-transform duration-300 ${
                    currentUser?.user_metadata?.cosmetics?.includes('avatar_glow') 
                      ? 'border-transparent shadow-indigo-500/50' 
                      : 'border-white dark:border-slate-900'
                  }`}>
                    {typeof userData.avatar === 'string' && userData.avatar.startsWith('http') ? (
                      <Image src={userData.avatar} alt="avatar" width={144} height={144} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl sm:text-5xl">{userData.avatar}</div>
                    )}
                  </div>
                  <label className="absolute -bottom-1 left-1/2 -translate-x-1/2 cursor-pointer opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full text-[10px] font-black shadow-lg text-slate-700 dark:text-slate-300">
                      {avatarUploading ? '…' : <Pencil className="w-3 h-3" />}
                    </span>
                    <input id="avatar-upload" accept="image/*" type="file" className="hidden" onChange={(ev) => handleAvatarChange(ev.target.files?.[0] ?? null)} />
                  </label>
                </div>
                
                {/* Mobile-only: Stats next to avatar */}
                <div className="flex-1 sm:hidden pt-2">
                  {currentUser && <FollowButton profileUserId={currentUser.id} />}
                </div>
              </div>

              {/* User Identity Section */}
              <div className="flex-1 min-w-0 z-10">
                {message && (
                  <div className="mb-3 inline-block px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-bold shadow-sm">
                    {message}
                  </div>
                )}

                <BadgedName 
                  name={userData.name}
                  userId={profileUserId}
                  isTeacher={currentUser?.user_metadata?.isTeacher}
                  totalPoints={userData.totalPoints}
                  nameClassName="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter"
                />
                <p className="text-slate-500 text-sm font-bold tracking-tight mt-0.5">@{userData.username || 'username'}</p>

                <div className="mt-3 flex flex-col gap-1">
                  <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                    {userData.school || 'Independent Learner'} {userData.grade ? `• Class ${userData.grade}` : ''}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-lg">
                    {userData.bio || 'Sharing my learning journey on Dheeyudhha 🧠'}
                  </p>
                </div>

                {/* Actions Row */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowEditProfile(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl transition-all active:scale-95 text-sm border border-slate-200 dark:border-slate-700"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                  {/* Desktop: stats inline with Edit button */}
                  <div className="hidden sm:block">
                    {currentUser && <FollowButton profileUserId={currentUser.id} />}
                  </div>
                </div>
              </div>

              {/* Rank Badge + Analysis — desktop sidebar */}
              <div className="hidden sm:flex flex-col gap-4 shrink-0 w-[220px]">
                {/* Learning Insight */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 p-5 rounded-2xl relative overflow-hidden">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-4 flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" /> Learning Insight
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Top Subject</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{favSubject}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-purple-50 dark:bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Top Mentor</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{favTeacher}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rank Card */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-2xl blur-sm opacity-20 group-hover:opacity-40 transition duration-500" />
                  <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 text-white p-5 rounded-2xl shadow-xl text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">Global Standing</div>
                    <div className="text-3xl font-black mb-2 tracking-tighter">Genius</div>
                    <div className="text-[10px] flex items-center justify-center gap-1.5 font-bold text-slate-400 bg-black/20 py-1 px-4 rounded-full border border-white/5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Rank #{profileRank || '?'}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Mobile-only: Learning Insight + Rank */}
            <div className="sm:hidden mt-6 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-indigo-500 mb-3 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Insight
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Top Subject</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">{favSubject}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Top Mentor</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">{favTeacher}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 text-white p-4 rounded-2xl text-center flex flex-col justify-center">
                <div className="text-[9px] font-bold uppercase tracking-widest text-amber-400 mb-1">Standing</div>
                <div className="text-2xl font-black tracking-tighter">Genius</div>
                <div className="text-[9px] flex items-center justify-center gap-1 font-bold text-slate-400 mt-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  #{profileRank || '?'}
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Stats Grid - Native mobile look */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12 relative z-10 px-1 sm:px-0">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 group hover:shadow-lg transition-all border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-slate-100 to-transparent dark:from-slate-800 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
 
              <div className={`${stat.bgColor} w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-5 border border-white/20 shadow-sm relative z-10 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-5 h-5 sm:w-7 sm:h-7 ${stat.color} drop-shadow-sm`} />
              </div>
              <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-0.5 sm:mb-1 relative z-10 drop-shadow-sm">{stat.value}</div>
              <div className="text-[10px] sm:text-sm font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase relative z-10">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mb-8 relative z-10">
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative overflow-hidden">
             <div
               className={`absolute top-1 bottom-1 w-1/3 rounded-xl bg-white dark:bg-slate-700 shadow-sm transition-transform duration-300 ${activeTab === 'posts' ? 'translate-x-[200%]' : activeTab === 'badges' ? 'translate-x-full' : 'translate-x-0'}`}
             />
             <button
               onClick={() => setActiveTab('achievements')}
               className={`relative z-10 px-5 py-2.5 text-sm font-black rounded-xl transition-colors w-1/3 ${activeTab === 'achievements' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
             >
               Stats
             </button>
             <button
               onClick={() => setActiveTab('badges')}
               className={`relative z-10 px-5 py-2.5 text-sm font-black rounded-xl transition-colors w-1/3 ${activeTab === 'badges' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
             >
               Badges
             </button>
             <button
               onClick={() => setActiveTab('posts')}
               className={`relative z-10 px-5 py-2.5 text-sm font-black rounded-xl transition-colors w-1/3 ${activeTab === 'posts' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
             >
               Posts
             </button>
          </div>
        </div>

        {/* Badges Tab Content */}
        {activeTab === 'badges' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Equipped Badges</h3>
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {equippedBadges.length}/{MAX_EQUIPPED_BADGES}
                </span>
              </div>
              {equippedBadges.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {equippedBadges.map((key) => (
                    <div
                      key={key}
                      className="h-12 sm:h-14 min-w-[52px] px-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/80 dark:bg-indigo-900/20 flex items-center justify-center"
                    >
                      <div className="scale-[1.2] sm:scale-[1.35]">{renderBadgeIcon(key)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Tap a badge below to equip it on your profile.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {earnedBadges.map((badge) => {
                const isEquipped = equippedBadges.includes(badge.key);
                return (
                  <button
                    key={badge.key}
                    type="button"
                    onClick={() => toggleEquipBadge(badge.key)}
                    disabled={equipSaving}
                    className={`text-left p-5 sm:p-6 rounded-3xl border transition-all duration-200 active:scale-[0.99] ${isEquipped
                      ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-900/20 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md'} ${equipSaving ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                        <div className="scale-[1.55]">{renderBadgeIcon(badge.key)}</div>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${isEquipped
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                      >
                        {isEquipped ? 'Equipped' : 'Tap to Equip'}
                      </span>
                    </div>

                    <h3 className="mt-4 text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">{badge.title}</h3>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{badge.description}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className={`text-sm font-black ${isEquipped ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {isEquipped ? 'Unequip' : 'Equip Badge'}
                      </span>
                    </div>
                  </button>
                );
              })}

              {lockedBadges.map((badge) => (
                <div
                  key={badge.key}
                  className="p-5 sm:p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 opacity-75"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <div className="scale-[1.45] grayscale">{renderBadgeIcon(badge.key)}</div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Locked
                    </span>
                  </div>
                  <h3 className="mt-4 text-base sm:text-lg font-black text-slate-700 dark:text-slate-300">{badge.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{badge.description}</p>
                </div>
              ))}
            </div>

            {earnedBadges.length === 0 && (
              <div className="mt-6 py-14 text-center flex flex-col items-center gap-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
                  <Award className="w-8 h-8" />
                </div>
                <p className="text-slate-400 font-bold italic tracking-tight">No special badges earned yet.</p>
              </div>
            )}
          </div>
        )}

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

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3.5 bg-purple-50 dark:bg-purple-900/40 rounded-2xl border border-purple-100 dark:border-purple-800 shadow-inner group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6 text-purple-600 dark:text-purple-400 drop-shadow-sm" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Solved Questions</h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 font-medium italic">Your latest triumphs in learning</p>

            <div className="space-y-4">
              {loadingSolved ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
                  ))}
                </div>
              ) : recentBattles.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic">No questions solved yet.</div>
              ) : (
                recentBattles.slice(0, 3).map((q, index) => (
                  <div
                    key={index}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1 transition-all duration-300 group/battle cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-full flex items-center justify-center font-black text-base sm:text-lg shadow-inner group-hover/battle:scale-105 transition-transform overflow-hidden shrink-0">
                           {q.createdByAvatar ? (
                             // eslint-disable-next-line @next/next/no-img-element
                             <img src={q.createdByAvatar} alt="author" width={48} height={48} className="object-cover w-full h-full" />
                           ) : (
                             <span className="text-slate-400">{q.subject?.charAt(0) || '?'}</span>
                           )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm sm:text-lg text-slate-900 dark:text-white group-hover/battle:text-purple-600 transition-colors truncate">{q.title}</h3>
                          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{q.subject}</p>
                        </div>
                      </div>
                      <div className="shrink-0 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black tracking-wide uppercase bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50">
                        Solved
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 pt-2 sm:pt-3 border-t border-slate-50 dark:border-slate-800/50">
                      <span className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg">+{q.points} <span className="hidden sm:inline">Points</span></span>
                      <span>{new Date(q.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link href="/solved" className="block w-full mt-8">
              <button className="w-full py-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-2xl transition-all duration-300 active:scale-95 border border-slate-200 dark:border-slate-700 shadow-sm">
                View All Solved
              </button>
            </Link>
          </div>
            </div>

            {/* Weekly Report */}
            {userData.showWeeklyReport && (
              <div className="mt-8 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm p-8 sm:p-10 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors pointer-events-none"></div>

                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3.5 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-inner group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400 drop-shadow-sm" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Weekly Report</h2>
                </div>

                {loadingReport ? (
                  <div className="h-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl"></div>
                ) : weeklyReport ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none hover:-translate-y-1 transition-transform group/card">
                      <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 dark:border-blue-800 group-hover/card:scale-110 transition-transform">
                        <Target className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-xs mb-2">Accuracy</h3>
                      <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{weeklyReport.stats.accuracy}<span className="text-3xl text-slate-400">%</span></div>
                      <div className="text-sm font-semibold mt-4 text-slate-500">
                        {weeklyReport.stats.correctAttempts} / {weeklyReport.stats.totalAttempts} questions answered
                      </div>
                      <div className="mt-4 bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full" style={{ width: `${weeklyReport.stats.accuracy}%` }} />
                      </div>
                    </div>

                    <div className="p-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl border border-indigo-400 shadow-xl shadow-indigo-500/30 hover:-translate-y-1 transition-transform group/card text-white relative overflow-hidden">
                      <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 border border-white/30 group-hover/card:scale-110 transition-transform backdrop-blur-sm">
                        <Star className="w-7 h-7 text-white drop-shadow-sm" />
                      </div>
                      <h3 className="font-bold text-indigo-100 uppercase tracking-widest text-xs mb-2">Performance Rating</h3>
                      <div className="text-4xl font-black text-white tracking-tight leading-tight">{weeklyReport.rating.label}</div>
                      <p className="text-sm font-medium text-emerald-50 mt-4 bg-black/20 px-4 py-3 rounded-xl inline-block border border-white/10 backdrop-blur-md leading-relaxed">{weeklyReport.rating.message}</p>
                    </div>

                    <div className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none hover:-translate-y-1 transition-transform group/card">
                      <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-6 border border-orange-100 dark:border-orange-800 group-hover/card:scale-110 transition-transform">
                         <Zap className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                      </div>
                      <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-xs mb-2">Active Days</h3>
                      <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{weeklyReport.stats.activeDays}<span className="text-2xl text-slate-400">/7</span></div>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-4 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-xl inline-block border border-emerald-100 dark:border-emerald-800">
                        {weeklyReport.stats.activeDays >= 3 ? 'Great consistency!' : 'Keep building the habit!'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 italic">Report not available.</div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'posts' && <MyPostsSection />}
      </main>
    </div>
  );
};

export default StudentProfile;