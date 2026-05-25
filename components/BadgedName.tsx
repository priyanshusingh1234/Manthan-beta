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
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function BadgedName({ 
  name, 
  userId,
  rank: propRank, 
  isTeacher, 
  totalPoints, 
  className = "",
  nameClassName = "font-bold text-slate-900 dark:text-white"
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

  return (
    <div className={`flex items-center gap-1.5 flex-wrap min-w-0 ${className}`}>
      <span className={`${nameClassName} truncate`}>{name}</span>
      
      {/* Container for badges ensuring they stay visible and don't shrink */}
      <div className="flex items-center gap-1 shrink-0">
        {isAdmin && <AdminVerifiedTick />}
        {isTeacher && <TeacherBadge />}
        {rank === 1 && <GoldBadge />}
        {rank === 2 && <SilverBadge />}
        {rank === 3 && <BronzeBadge />}
        {isTopper && <TopperBadge />}
      </div>
    </div>
  );
}
