'use client';

import React from 'react';
import useSWR from 'swr';
import { GoldBadge, SilverBadge, BronzeBadge } from '@/ticks/RankBadges';
import TopperBadge from '@/ticks/topper';
import TeacherBadge from '@/ticks/teacher';
import AdminVerifiedTick from '@/ticks/admin';
import { useTopRanks } from '@/hooks/useTopRanks';

interface BadgedNameProps {
  name: string;
  userId?: string;
  rank?: number;
  isTeacher?: boolean;
  totalPoints?: number;
  className?: string;
  nameClassName?: string;
  cosmetics?: string[] | null;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function BadgedName({ 
  name, 
  userId,
  rank: propRank, 
  isTeacher, 
  totalPoints, 
  className = "",
  nameClassName = "font-bold text-slate-900 dark:text-white",
  cosmetics
}: BadgedNameProps) {
  const { getRank } = useTopRanks();
  const { data: adminsData } = useSWR('/api/admins', fetcher, { 
    revalidateOnFocus: false,
    dedupingInterval: 300000 // 5 minutes
  });
  
  const isAdmin = userId && adminsData?.adminIds?.includes(userId);

  const liveRank = userId ? getRank(userId) : null;
  const normalizedPropRank = (propRank !== undefined && propRank !== null && !isNaN(Number(propRank)) && Number(propRank) > 0)
    ? Number(propRank)
    : null;
  const normalizedLiveRank = (liveRank !== undefined && liveRank !== null && !isNaN(Number(liveRank)) && Number(liveRank) > 0)
    ? Number(liveRank)
    : null;

  // Trust the provided rank if it's available (don't fall back to stale cache for top 3).
  // Only hunt for a rank if the prop is strictly missing.
  const rank = normalizedPropRank !== null ? normalizedPropRank : normalizedLiveRank;
  
  // Ensure we get a boolean, avoiding rendering 'NaN' if totalPoints is malformed
  const isTopper = typeof totalPoints === 'number' && !isNaN(totalPoints) && totalPoints >= 1500;
  
  const equippedBadgeId = cosmetics?.find(c => c.startsWith('equipped_badge_'))?.replace('equipped_badge_', '');

  return (
    <View className={`flex items-center gap-1.5 flex-wrap min-w-0 ${className}`}>
      <Text className={`${nameClassName} truncate`}>{name}</Text>
      
      {/* Container for badges ensuring they stay visible and don't shrink */}
      <View className="flex items-center gap-1 shrink-0 flex-row">
        {(!equippedBadgeId || equippedBadgeId === 'admin') && isAdmin && <AdminVerifiedTick />}
        {(!equippedBadgeId || equippedBadgeId === 'teacher') && isTeacher && <TeacherBadge />}
        {(!equippedBadgeId || equippedBadgeId === 'gold') && rank === 1 && <GoldBadge />}
        {(!equippedBadgeId || equippedBadgeId === 'silver') && rank === 2 && <SilverBadge />}
        {(!equippedBadgeId || equippedBadgeId === 'bronze') && rank === 3 && <BronzeBadge />}
        {(!equippedBadgeId || equippedBadgeId === 'topper') && isTopper && <TopperBadge />}
      </View>
    </View>
  );
}
