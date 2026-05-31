import { Loader2 } from 'lucide-react-native';

export default function ChatLoading() {
  return (
    <View className="flex flex-col h-[100dvh] w-full bg-slate-50 dark:bg-slate-950">
      {/* Skeleton Header */}
      <View className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-4 gap-3 shrink-0 flex-row">
        <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <View className="flex flex-col gap-2">
          <View className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <View className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </View>
      </View>
      
      {/* Skeleton Body */}
      <View className="flex-1 flex items-center justify-center flex-row">
        <View className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <Text className="text-slate-400 text-sm font-medium">Connecting to chat...</Text>
        </View>
      </View>
    </View>
  );
}
