import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Play, Clock, Users, Zap, Swords, Award, CheckCircle, FileText, Share2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import DuelChallengeModal from './DuelChallengeModal';
import BadgedName from './BadgedName';
import ShareModal from './ShareModal';

interface Props {
  q: any;
}

const QuestionCard = React.memo(function QuestionCard({ q }: Props) {
  const router = useRouter();
  const [duelOpen, setDuelOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
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

  const resolveImageUrl = () => {
    const rawUrl = q?.imageUrl || q?.image_url;
    if (rawUrl) {
      if (rawUrl.startsWith('http')) return rawUrl;
      if (rawUrl.startsWith('/')) return `${process.env.EXPO_PUBLIC_API_URL}${rawUrl}`;
      return `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/question-images/${rawUrl}`;
    }
    const rawPath = q?.imagePath || q?.image_path;
    if (rawPath) {
      return `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/question-images/${rawPath}`;
    }
    return null;
  };
  const imageUrl = resolveImageUrl();

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
  const isVip = q?.is_vip;
  const documentUrl = q?.document_url || q?.documentUrl || null;

  return (
    <>
      <View 
        className={
          isVip
            ? "bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-slate-900 dark:to-slate-950 py-4 px-4 border-b border-[#E5E5EA] dark:border-[#1C1C1E]"
            : "bg-white dark:bg-slate-950 py-4 px-4 border-b border-[#E5E5EA] dark:border-slate-800/50"
        }
      >
        {/* Header */}
        <HeaderWrapper>
          <View className={`w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 ${Array.isArray(q?.profiles?.cosmetics) && q.profiles.cosmetics.includes('avatar_glow') ? 'border-indigo-400' : 'border-white dark:border-slate-800'} shadow-sm items-center justify-center mr-1`}>
            {teacherAvatar && !teacherAvatar.includes('googleusercontent') ? (
              <Image source={{ uri: teacherAvatar }} alt={teacherName} className="w-full h-full" />
            ) : (
              <Text className="text-blue-600 dark:text-blue-400 font-bold text-sm">{teacherName.substring(0, 2).toUpperCase()}</Text>
            )}
          </View>
          <View className="flex-1 justify-center">
            <BadgedName 
              name={teacherName} 
              userId={q?.created_by} 
              isTeacher={q?.profiles?.is_teacher}
              cosmetics={q?.profiles?.cosmetics || []}
              nameClassName="font-extrabold text-slate-900 dark:text-slate-100 text-[15px] tracking-tight"
              containerClassName="flex-row items-center gap-1 mb-0.5"
            />
            <Text className="text-[12px] text-slate-500 dark:text-slate-400 font-medium" numberOfLines={1}>
              {q?.subject || 'General'}
              {q?.class_grade && ` · Class ${q.class_grade}`}
              {q?.chapter && ` · ${q.chapter}`}
            </Text>
          </View>
        </HeaderWrapper>

        {/* Content Area */}
        <View className="px-1">
          {/* Subtle Metadata Row */}
          <View className="flex-row items-center flex-wrap gap-2 mb-2.5 mt-1">
            {q?._feedLabel ? (
              <View className={`${isVip ? 'bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/50' : 'bg-indigo-50 dark:bg-indigo-900/40'} rounded-md px-1.5 py-0.5 flex-row items-center`}>
                <Text className={`${isVip ? 'text-amber-700 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'} text-[9px] font-bold tracking-widest uppercase`}>
                  {q._feedLabel}
                </Text>
              </View>
            ) : null}
            {q.points ? (
          <View className="flex-row items-center bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded ml-2">
            <Award size={12} color="#d97706" />
            <Text className="text-amber-600 dark:text-amber-500 text-[10px] font-bold ml-1">{q.points} XP</Text>
          </View>
        ) : null}
            {q?.question_type === 'match' && (
              <View className="bg-amber-50 dark:bg-amber-900/40 rounded-md px-1.5 py-0.5 flex-row items-center">
                <Text className="text-amber-600 dark:text-amber-400 text-[9px] font-bold tracking-widest uppercase">Match</Text>
              </View>
            )}
            {(q?.points || 0) > 15 && q?.question_type !== 'match' && (
              <View className="bg-violet-50 dark:bg-violet-900/40 rounded-md px-1.5 py-0.5 flex-row items-center">
                <Text className="text-violet-600 dark:text-violet-400 text-[9px] font-bold tracking-widest uppercase">Written</Text>
              </View>
            )}
            {q?.difficulty && (
              <View className="bg-emerald-50 dark:bg-emerald-900/30 rounded-md px-1.5 py-0.5 flex-row items-center">
                <Text className="text-emerald-600 dark:text-emerald-400 text-[9px] font-bold tracking-widest uppercase">{q.difficulty}</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text className="text-[17px] font-extrabold text-slate-900 dark:text-slate-100 mb-2 leading-snug tracking-tight">
            {q?.title || 'Untitled Question'}
          </Text>
          
          {/* Body */}
          {q?.body ? (
            <Text className="text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed mb-4" numberOfLines={3}>
              {q.body}
            </Text>
          ) : (
             <View className="mb-2" />
          )}

          {/* Note Document UI */}
          {documentUrl ? (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => router.push(`/notes/${q.id}` as any)}
              className="flex-row items-center p-3 rounded-xl mb-4 border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-900/10"
            >
              <View className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center mr-3">
                <FileText size={20} color="#f43f5e" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>Educational Note</Text>
                <Text className="text-xs text-rose-500 font-bold mt-0.5">Tap to view PDF</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {/* Media Attachment */}
          {imageUrl && (
            <View className="relative w-full rounded-[20px] overflow-hidden border border-slate-200/50 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-800 mb-4 items-center justify-center">
              <Image 
                source={{ uri: imageUrl }} 
                className="w-full h-48"
                resizeMode="contain"
              />
              <View className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 rounded border border-white/20 shadow-sm">
                <Text className="text-[9px] font-extrabold text-white uppercase tracking-wider">Attachment</Text>
              </View>
            </View>
          )}

          {/* Match Preview */}
          {q?.question_type === 'match' && q?.match_pairs && q.match_pairs.length > 0 && (
            <View className="mb-4 bg-slate-50 dark:bg-slate-800/40 rounded-[20px] border border-slate-100/50 dark:border-slate-700/30 p-3">
              <View className="flex-row items-stretch justify-between gap-4">
                <View className="flex-1 gap-2">
                  {q.match_pairs.slice(0, 2).map((pair: any, idx: number) => (
                    <View key={`left-${idx}`} className="bg-white dark:bg-slate-800 rounded-xl p-2 text-center shadow-sm relative border border-slate-100/50 dark:border-slate-700/50">
                      <Text className="text-[12px] font-bold text-slate-700 dark:text-slate-300" numberOfLines={1}>{pair.left}</Text>
                      <View className="absolute top-1/2 -right-1 w-2 h-2 rounded-full bg-indigo-400 -translate-y-1 border border-white dark:border-slate-800" />
                    </View>
                  ))}
                </View>
                <View className="w-6 items-center justify-around opacity-30">
                  <View className="flex-1 w-[2px] border-l-2 border-indigo-400 border-dashed" />
                </View>
                <View className="flex-1 gap-2">
                  {q.match_pairs.slice(0, 2).map((pair: any, idx: number) => (
                    <View key={`right-${idx}`} className="bg-white dark:bg-slate-800 rounded-xl p-2 text-center shadow-sm relative border border-slate-100/50 dark:border-slate-700/50">
                      <View className="absolute top-1/2 -left-1 w-2 h-2 rounded-full bg-indigo-400 -translate-y-1 border border-white dark:border-slate-800" />
                      <Text className="text-[12px] font-bold text-slate-700 dark:text-slate-300" numberOfLines={1}>{pair.right}</Text>
                    </View>
                  ))}
                </View>
              </View>
              {q.match_pairs.length > 2 && (
                <Text className="mt-2 text-center text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">+{q.match_pairs.length - 2} more pairs</Text>
              )}
            </View>
          )}

          {/* Action Footer Bar */}
          <View className="flex-row items-center justify-between flex-wrap gap-y-2 bg-slate-50 dark:bg-slate-800/40 rounded-[20px] px-2 py-1.5 border border-slate-100/50 dark:border-slate-700/30">
            {/* Left side: Metrics */}
            <View className="flex-1 flex-row items-center flex-wrap gap-x-3 gap-y-1 px-2">
              <View className="flex-row items-center gap-1">
                <Zap size={14} color="#f59e0b" fill="#f59e0b" />
                <Text className="text-[13px] font-extrabold text-amber-600 dark:text-amber-400">{q?.points || 0}</Text>
              </View>

              {q?.time_limit && (
                <View className="flex-row items-center gap-1">
                  <Clock size={14} color="#64748b" />
                  <Text className="text-[12px] font-bold text-slate-500 dark:text-slate-400">{q.time_limit}m</Text>
                </View>
              )}

              {(q?.solved_count !== undefined && q?.solved_count !== null) && (
                <View className="flex-row items-center gap-1">
                  <Users size={14} color="#64748b" />
                  <Text className="text-[12px] font-bold text-slate-500 dark:text-slate-400">{q.solved_count}</Text>
                </View>
              )}
            </View>

            {/* Right side: Actions */}
            <View className="flex-row items-center gap-1.5">
              {showDuelButton && (
                <TouchableOpacity
                  onPress={() => setDuelOpen(true)}
                  className="bg-orange-100 dark:bg-orange-900/40 px-3 py-1.5 rounded-xl flex-row items-center gap-1.5 active:opacity-70"
                >
                  <Swords size={12} color="#ea580c" />
                  <Text className="text-orange-600 dark:text-orange-400 font-extrabold text-[11px] uppercase tracking-wider">Duel</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setShowShareModal(true)}
                className="bg-slate-100 dark:bg-slate-700/50 p-2 rounded-xl active:opacity-70"
              >
                <Share2 size={16} color="#64748b" />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => router.push(`/solve/${q.id}` as any)}
                className={`${q.hasAttempted ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-slate-900 dark:bg-indigo-500'} flex-row items-center gap-1.5 px-4 py-1.5 rounded-xl active:opacity-70 shadow-sm`}
              >
                {q.hasAttempted ? (
                  <CheckCircle size={12} color="white" />
                ) : (
                  <Play size={10} color="white" fill="white" />
                )}
                <Text className="text-white font-extrabold text-[11px] uppercase tracking-wider">
                  {q.hasAttempted ? 'Solved' : 'Attempt'}
                </Text>
              </TouchableOpacity>
            </View>
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

      <ShareModal 
        url={`${process.env.EXPO_PUBLIC_API_URL}/questions/${q.id}`}
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
});

export default QuestionCard;

