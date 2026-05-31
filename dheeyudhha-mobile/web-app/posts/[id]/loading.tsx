import { Loader2 } from 'lucide-react-native';

export default function PostLoading() {
    return (
        <View className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 flex-row">
            <View className="animate-pulse flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <Text className="text-slate-500 font-medium">Loading post...</Text>
            </View>
        </View>
    );
}
