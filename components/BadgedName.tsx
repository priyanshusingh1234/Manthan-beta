'use client';

import React from 'react';
import { GoldBadge, SilverBadge, BronzeBadge } from '@/ticks/RankBadges';
import TopperBadge from '@/ticks/topper';
import TeacherBadge from '@/ticks/teacher';
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

export default function BadgedName({ 
  name, 
  userId,
  rank: propRank, 
  isTeacher, 
  totalPoints, 
  className = "flex items-center gap-1.5 flex-wrap min-w-0",
  nameClassName = "font-bold text-slate-900 dark:text-white"
}: BadgedNameProps) {
  const { getRank } = useTopRanks();
  const rank = propRank || (userId ? getRank(userId) : null);
  // Ensure we get a boolean, avoiding rendering 'NaN' if totalPoints is NaN
  const isTopper = typeof totalPoints === 'number' && totalPoints >= 1500;

  return (
    <div className={className}>
      <span className={`${nameClassName} truncate`}>{name}</span>
      
      {/* Container for badges ensuring they stay visible and don't shrink */}
      <div className="flex items-center gap-1 shrink-0">
        {isTeacher && <TeacherBadge />}
        {rank === 1 && <GoldBadge />}
        {rank === 2 && <SilverBadge />}
        {rank === 3 && <BronzeBadge />}
        {isTopper && <TopperBadge />}
      </div>
    </div>
  );
}
