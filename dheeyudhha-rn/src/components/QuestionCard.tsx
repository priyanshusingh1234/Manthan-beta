import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Play, Clock, Users, Zap, Swords } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import DuelChallengeModal from './DuelChallengeModal';

interface Props {
  q: any;
}

const QuestionCard = React.memo(function QuestionCard({ q }: Props) {
  const router = useRouter();
  const [duelOpen, setDuelOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        setIsTeacher(!!user.user_metadata?.isTeacher);
      }
    });
  }, []);

  const teacherName = q?.profiles?.full_name || 'Teacher';
  const teacherAvatar = q?.profiles?.avatar_url;
  const teacherUsername = q?.profiles?.username;

  const imageUrl = q?.image_url 
    ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/question-images/${q.image_url}`
    : null;

  const HeaderWrapper = ({ children }: { children: React.ReactNode }) => {
    if (teacherUsername) {
      return (
        <TouchableOpacity 
          onPress={() => router.push(`/user/${teacherUsername}` as any)} 
          activeOpacity={0.7} 
          className="flex-row items-center gap-3 mb-3"
        >
          {children}
        </TouchableOpacity>
      );
    }
    return (
      <View className="flex-row items-center gap-3 mb-3">
        {children}
      </View>
    );
  };

  const showDuelButton = currentUserId && !isTeacher && Array.isArray(q.options) && q.options.length > 0 && !q.hasAttempted;

  return (
    <>
      <View className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
        {/* Header */}
        <HeaderWrapper>
          {teacherAvatar && !teacherAvatar.includes('googleusercontent') ? (
            <Image source={{ uri: teacherAvatar }} alt={teacherName} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800" />
          ) : (
            <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 items-center justify-center border border-blue-200 dark:border-blue-900">
              <Text className="text-blue-600 dark:text-blue-400 font-bold text-sm">{teacherName.substring(0, 2).toUpperCase()}</Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="font-bold text-slate-900 dark:text-slate-100 text-sm">{teacherName}</Text>
            <View className="flex-row items-center gap-2 mt-0.5">
              <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{q?.subject || 'General'}</Text>
              {q?.class_grade && (
                <>
                  <View className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Class {q.class_grade}</Text>
                </>
              )}
            </View>
          </View>
        </HeaderWrapper>

        {/* Body */}
        <View className="mb-3">
          <View className="flex-row flex-wrap gap-2 mb-2">
            {/* Algorithm Tag / Feed Label */}
            {q?._feedLabel && (
              <View className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 px-1.5 py-0.5 rounded flex-row items-center">
                <Text className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">{q._feedLabel}</Text>
              </View>
            )}
            
            {/* Match The Following Badge */}
            {q?.question_type === 'match' && (
              <View className="bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded flex-row items-center">
                <Text className="text-[9px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Match</Text>
              </View>
            )}
            
            {/* Written Badge */}
            {(q?.points || 0) > 15 && q?.question_type !== 'match' && (
              <View className="bg-violet-100 dark:bg-violet-900/40 border border-violet-200 dark:border-violet-800 px-1.5 py-0.5 rounded flex-row items-center">
                <Text className="text-[9px] font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">Written</Text>
              </View>
            )}

            {q?.difficulty && (
              <View className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-1.5 py-0.5 rounded flex-row items-center">
                <Text className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{q.difficulty}</Text>
              </View>
            )}
            {q?.time_limit && (
              <View className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded flex-row items-center gap-1">
                <Clock size={9} color="#64748b" />
                <Text className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{q.time_limit}m</Text>
              </View>
            )}
            {(q?.solved_count !== undefined && q?.solved_count !== null) && (
              <View className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 px-1.5 py-0.5 rounded flex-row items-center gap-1">
                <Users size={9} color="#3b82f6" />
                <Text className="text-[9px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">{q.solved_count} Solved</Text>
              </View>
            )}
          </View>
          
          <Text className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 leading-snug group-hover:text-blue-700 transition-colors">
            {q?.title || 'Untitled Question'}
          </Text>
          
          {q?.body && (
            <Text className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3" numberOfLines={3}>
              {q.body}
            </Text>
          )}

          {imageUrl && (
            <View className="relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mb-3">
              <View className="flex items-center justify-center bg-slate-100/50 dark:bg-slate-900/50 p-2">
                <Image 
                  source={{ uri: imageUrl }} 
                  alt="Attachment"
                  className="w-full h-48 rounded-lg"
                  resizeMode="contain"
                />
              </View>
              <View className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded flex-row items-center">
                <Text className="text-[10px] font-bold text-white uppercase tracking-wider">Attachment</Text>
              </View>
            </View>
          )}

          {/* Match the following preview for UI parity */}
          {q?.question_type === 'match' && q?.match_pairs && q.match_pairs.length > 0 && (
            <View className="mt-1 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/80 p-3">
              <View className="flex-row items-stretch justify-between gap-4">
                <View className="flex-1 gap-2">
                  {q.match_pairs.slice(0, 2).map((pair: any, idx: number) => (
                    <View key={`left-${idx}`} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-center shadow-sm relative">
                      <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300" numberOfLines={1}>{pair.left}</Text>
                      <View className="absolute top-1/2 -right-1 w-1.5 h-1.5 rounded-full bg-indigo-400 -translate-y-0.5" />
                    </View>
                  ))}
                </View>
                <View className="w-8 items-center justify-around opacity-30">
                  <View className="flex-1 w-[2px] border-l-2 border-indigo-500 border-dashed" />
                </View>
                <View className="flex-1 gap-2">
                  {q.match_pairs.slice(0, 2).map((pair: any, idx: number) => (
                    <View key={`right-${idx}`} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-center shadow-sm relative">
                      <View className="absolute top-1/2 -left-1 w-1.5 h-1.5 rounded-full bg-indigo-400 -translate-y-0.5" />
                      <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300" numberOfLines={1}>{pair.right}</Text>
                    </View>
                  ))}
                </View>
              </View>
              {q.match_pairs.length > 2 && (
                <Text className="mt-2 text-center text-[10px] text-slate-400 font-medium">+{q.match_pairs.length - 2} more pairs</Text>
              )}
            </View>
          )}
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
          <View className="flex-row items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-100/80 dark:border-amber-900/50 px-2 py-1.5 rounded-lg shadow-sm">
            <View className="bg-amber-100 dark:bg-amber-900/50 p-0.5 rounded-full">
              <Zap size={10} color="#f59e0b" fill="#f59e0b" />
            </View>
            <Text className="text-[10px] font-bold text-amber-900 dark:text-amber-300">{q?.points || 0} <Text className="font-normal opacity-70">PTS</Text></Text>
          </View>

          <View className="flex-row gap-2 items-center">
            {showDuelButton && (
              <TouchableOpacity
                onPress={() => setDuelOpen(true)}
                className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/30 px-3 py-1.5 rounded-lg flex-row items-center gap-1.5 active:scale-95 transition-transform"
              >
                <Swords size={12} color="#ea580c" />
                <Text className="text-orange-600 dark:text-orange-400 font-bold text-[10px] uppercase tracking-wider">Duel</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              onPress={() => router.push(`/solve/${q.id}` as any)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg active:scale-95 transition-transform shadow-sm"
            >
              <Play size={10} color="white" fill="white" />
              <Text className="text-white font-bold text-[10px] uppercase tracking-wider">Attempt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {duelOpen && currentUserId && (
        <DuelChallengeModal
          isOpen={duelOpen}
          onClose={() => setDuelOpen(false)}
          questionId={q.id}
          questionTitle={q.title}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
});

export default QuestionCard;

