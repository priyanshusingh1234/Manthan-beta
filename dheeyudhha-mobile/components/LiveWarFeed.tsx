import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
'use client';

import { Flame, TrendingUp, Trophy, Zap } from 'lucide-react-native';
import React from 'react';
import { Image } from 'react-native';

interface FeedItem {
  id: number;
  type: string;
  user: string;
  school: string;
  text: string;
  badge?: string;
  heat: 'high' | 'critical' | 'medium';
  urgent?: boolean;
}

const feed: FeedItem[] = [
  {
    id: 1,
    type: 'solve',
    user: 'Rahul',
    school: 'DPS Noida',
    text: 'solved a Trigonometry doubt.',
    badge: '+20 Pts',
    heat: 'high',
  },
  {
    id: 2,
    type: 'urgent',
    user: 'Priya',
    school: 'KV Sec-12',
    text: 'needs help with Physics.',
    urgent: true,
    heat: 'critical',
  },
  {
    id: 3,
    type: 'solve',
    user: 'Ananya',
    school: 'DPS Noida',
    text: 'solved a Chemistry doubt.',
    badge: '+15 Pts',
    heat: 'medium',
  },
]

const LiveWarFeed: React.FC = () => {
  return (
    <View className="animate-fadeIn">
      {/* Battle Statistics Banner */}
      <View className="mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-4 shadow-lg animate-gradient" style={{ backgroundSize: '150% 150%' }}>
        <View className="flex items-center justify-between text-white flex-row">
          <View className="flex items-center gap-2 flex-row">
            <Trophy className="h-5 w-5 animate-float" />
            <Text className="text-sm font-semibold">Live War Stats</Text>
            <Text className="flex h-2 w-2 relative flex-row">
              <Text className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75 flex-row"></Text>
              <Text className="relative inline-flex rounded-full h-2 w-2 bg-white flex-row"></Text>
            </Text>
          </View>
        </View>
        <View className="mt-3 grid grid-cols-2 gap-4">
          <View className="text-center rounded-xl bg-white/20 backdrop-blur-sm p-3">
            <View className="text-xs font-medium text-white/90">DPS Noida</View>
            <View className="text-2xl font-bold text-white">2,340</View>
            <View className="text-xs text-white/80">Points</View>
          </View>
          <View className="text-center rounded-xl bg-white/20 backdrop-blur-sm p-3">
            <View className="text-xs font-medium text-white/90">KV Sec-12</View>
            <View className="text-2xl font-bold text-white">2,180</View>
            <View className="text-xs text-white/80">Points</View>
          </View>
        </View>
        {/* Battle Progress Bar */}
        <View className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/30">
          <View className="h-full bg-white rounded-full transition-all duration-500" style={{ width: '52%' }}></View>
        </View>
        <View className="mt-1 flex justify-between text-xs text-white/90 flex-row">
          <Text>DPS Leading</Text>
          <Text>Gap: 160 pts</Text>
        </View>
      </View>

      <View className="mb-3 flex items-center justify-between px-1 flex-row">
        <Text className="text-lg font-semibold text-gray-900 flex items-center gap-2 flex-row">
          <Zap className="h-5 w-5 text-orange-500 animate-pulse-soft" />
          Live War Feed
        </Text>
        <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">Show All</a>
      </View>
      <View className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 flex-row">
        {feed.map((item) => (
          <View
            key={item.id}
            className="snap-start min-w-[280px] max-w-[320px] rounded-2xl bg-white p-4 shadow ring-1 ring-black/5 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 animate-popIn"
          >
            {/* Battle Heat Indicator */}
            {item.heat && (
              <View className="absolute top-2 right-2 flex items-center gap-1 flex-row">
                {item.heat === 'critical' && <Flame className="h-4 w-4 text-red-600 animate-pulse-soft" />}
                {item.heat === 'high' && <Flame className="h-4 w-4 text-orange-500" />}
                {item.heat === 'medium' && <TrendingUp className="h-4 w-4 text-yellow-500" />}
              </View>
            )}

            <View className="flex items-center gap-3 flex-row">
              <Image source={{ uri: `/avatars/${item.user.toLowerCase() }}.png`}
                onError={(e: React.syntheticEvent<HTMLImageElement, Event>) => (e.currentTarget.src = 'https://placehold.co/50')}
                alt={`${item.user} avatar`}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-100"
              />
              <View className="leading-tight">
                <View className="font-semibold text-gray-900">{item.user}</View>
                <View className="text-xs text-gray-500">{item.school}</View>
              </View>
              {item.urgent && (
                <Text className="ml-auto inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 animate-pulse-soft flex-row">
                  <Flame className="h-3.5 w-3.5" /> Urgent
                </Text>
              )}
            </View>
            <Text className="mt-3 text-sm text-gray-800">
              <Text className="font-medium">{item.user}</Text> {item.text}
            </Text>
            {item.badge && (
              <View className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-600 animate-popIn flex-row">
                <Trophy className="h-3.5 w-3.5" />
                {item.badge}
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  )
}

export default LiveWarFeed;