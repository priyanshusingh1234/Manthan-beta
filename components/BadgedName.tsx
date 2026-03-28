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
  className = "flex items-center gap-1.5 flex-wrap",
  nameClassName = "font-bold text-slate-900 dark:text-white"
}: BadgedNameProps) {
  const { getRank } = useTopRanks();
  const rank = propRank || (userId ? getRank(userId) : null);
  const isTopper = totalPoints && totalPoints >= 1500;

  return (
    <div className={className}>
      <span className={nameClassName}>{name}</span>
      
      {/* Teacher Badge */}
      {isTeacher && <TeacherBadge />}
      
      {/* Rank Badges (Top 3) */}
      {rank === 1 && <GoldBadge />}
      {rank === 2 && <SilverBadge />}
      {rank === 3 && <BronzeBadge />}
      
      {/* Topper Badge (1500+ points) */}
      {isTopper && <TopperBadge />}
    </div>
  );
}
