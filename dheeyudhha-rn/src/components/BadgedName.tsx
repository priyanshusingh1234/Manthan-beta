import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from 'react-native-svg';


export const GoldBadge = () => {
  const id = (React.useId ? React.useId().replace(/:/g, '') : `gold-${Math.floor(Math.random() * 1000)}`) + 'gold';
  return (
  <View style={{ marginLeft: 4, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id={id} x1="4" y1="2" x2="20" y2="22">
          <Stop offset="0%" stopColor="#FDE68A" />
          <Stop offset="40%" stopColor="#FBBF24" />
          <Stop offset="100%" stopColor="#92400E" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M4 10C2 8 2 4 6 4M20 10C22 8 22 4 18 4" stroke="#FBBF24" strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
      <Path d="M12 2L15 5H9L12 2Z" fill="#FBBF24" />
      <Path d="M12 4L5 7V12C5 17.5 8.5 21.5 12 23C15.5 21.5 19 17.5 19 12V7L12 4Z" fill={`url(#${id})`} stroke="#78350F" strokeWidth={0.5} />
      <Path d="M12 9L13.2 11.5H16L13.8 13.2L14.6 15.8L12.4 14.2L10.2 15.8L11 13.2L8.8 11.5H11.6L12.8 9Z" fill="white" />
    </Svg>
  </View>
);};

export const SilverBadge = () => {
  const id = (React.useId ? React.useId().replace(/:/g, '') : `silver-${Math.floor(Math.random() * 1000)}`) + 'silver';
  return (
  <View style={{ marginLeft: 4, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id={id} x1="4" y1="4" x2="20" y2="20">
          <Stop offset="0%" stopColor="#F1F5F9" />
          <Stop offset="50%" stopColor="#94A3B8" />
          <Stop offset="100%" stopColor="#334155" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M12 2L20 6V12C20 18 12 22 12 22C12 22 4 18 4 12V6L12 2Z" fill={`url(#${id})`} stroke="#1E293B" strokeWidth={1} />
      <Circle cx={12} cy={12} r={4} fill="#1E293B" opacity={0.2} />
    </Svg>
  </View>
);};

export const BronzeBadge = () => {
  const id = (React.useId ? React.useId().replace(/:/g, '') : `bronze-${Math.floor(Math.random() * 1000)}`) + 'bronze';
  return (
  <View style={{ marginLeft: 4, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id={id} x1="12" y1="2" x2="12" y2="22">
          <Stop offset="0%" stopColor="#F97316" />
          <Stop offset="100%" stopColor="#7C2D12" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M8 15V22L12 20L16 22V15" fill="#7C2D12" opacity={0.8} />
      <Circle cx={12} cy={11} r={9} fill={`url(#${id})`} stroke="#431407" strokeWidth={1.5} />
      <Circle cx={12} cy={11} r={7} stroke="white" strokeWidth={0.5} strokeDasharray="2 1" opacity={0.5} />
    </Svg>
  </View>
);};

export const TopperBadge = () => {
  const id = (React.useId ? React.useId().replace(/:/g, '') : `topper-${Math.floor(Math.random() * 1000)}`) + 'topper';
  return (
  <View style={{ marginLeft: 4, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id={id} x1="4" y1="2" x2="20" y2="22">
          <Stop offset="0%" stopColor="#FBBF24" />
          <Stop offset="50%" stopColor="#D97706" />
          <Stop offset="100%" stopColor="#92400E" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M12 2L4 5V11C4 16.5 7.5 20.5 12 22C16.5 20.5 20 16.5 20 11V5L12 2Z" fill={`url(#${id})`} />
      <Path d="M12 7L13.5 10.5H17L14.2 12.5L15.2 16L12 14L8.8 16L9.8 12.5L7 10.5H10.5L12 7Z" fill="white" />
    </Svg>
  </View>
);};

export const TeacherVerifiedBadge = () => (
  <View style={{ marginLeft: 4, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" fill="#22c55e" />
      <Path d="M7.75 12.75L10.25 15.25L16.25 9.25" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  </View>
);

export const AdminVerifiedBadge = () => (
  <View style={{ marginLeft: 4, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="#1DA1F2" />
      <Path fillRule="evenodd" clipRule="evenodd" d="M16.7071 8.29289C17.0976 8.68342 17.0976 9.31658 16.7071 9.70711L11.7071 14.7071C11.3166 15.0976 10.6834 15.0976 10.2929 14.7071L7.29289 11.7071C6.90237 11.3166 6.90237 10.6834 7.29289 10.2929C7.68342 9.90237 8.31658 9.90237 8.70711 10.2929L11 12.5858L15.2929 8.29289C15.6834 7.90237 16.3166 7.90237 16.7071 8.29289Z" fill="white" />
    </Svg>
  </View>
);

import { useAdmins } from '@/hooks/useAdmins';

export default function BadgedName({
  name,
  userId,
  isTeacher,
  isTopper,
  rank,
  nameClassName = "text-[20px] font-black text-slate-900 dark:text-white leading-tight",
  containerClassName = "flex-row items-center gap-1.5 flex-wrap",
  cosmetics,
}: {
  name: string;
  userId?: string | null;
  isTeacher?: boolean;
  isTopper?: boolean;
  rank?: number | null;
  nameClassName?: string;
  containerClassName?: string;
  cosmetics?: string[];
  iconSize?: number;
}) {
  const { isAdmin } = useAdmins();
  const isUserAdmin = isAdmin(userId);

  const equippedBadgeId = Array.isArray(cosmetics) 
    ? cosmetics.find(c => typeof c === 'string' && c.startsWith('equipped_badge_'))?.replace('equipped_badge_', '')
    : null;

  return (
    <View className={containerClassName}>
      <Text className={nameClassName}>{name}</Text>
      <View className="flex-row items-center gap-1 shrink-0">
        {(!equippedBadgeId || equippedBadgeId === 'admin') && isUserAdmin && <AdminVerifiedBadge />}
        {(!equippedBadgeId || equippedBadgeId === 'teacher') && isTeacher && <TeacherVerifiedBadge />}
        {(!equippedBadgeId || equippedBadgeId === 'gold') && rank === 1 && <GoldBadge />}
        {(!equippedBadgeId || equippedBadgeId === 'silver') && rank === 2 && <SilverBadge />}
        {(!equippedBadgeId || equippedBadgeId === 'bronze') && rank === 3 && <BronzeBadge />}
        {(!equippedBadgeId || equippedBadgeId === 'topper') && isTopper && <TopperBadge />}
      </View>
    </View>
  );
}
