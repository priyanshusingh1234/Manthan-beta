"use client";
import { Link } from 'expo-router';
import { Home, Compass, MapPinOff, ArrowLeft, Ghost } from 'lucide-react-native';

/**
 * 🚀 Premium 404 Case for Dheeyudha.
 * Shows a "Deep Dive" / "Void" theme as requested.
 */
export default function NotFound() {
  return (
    <View className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden flex-row">
      
      {/* ── Background decoration ── */}
      <View className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 dark:opacity-40">
        <View className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] animate-pulse" />
        <View className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500 rounded-full blur-[100px] animate-pulse delay-700" />
      </View>

      <View className="max-w-md w-full text-center relative z-10 space-y-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* ── Icon / Visual ── */}
        <View className="relative inline-block">
          <View className="w-32 h-32 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 rotate-6 transition-transform hover:rotate-0 flex-row">
             <MapPinOff className="w-16 h-16 text-indigo-500" />
             <View className="absolute -top-4 -right-4 w-12 h-12 bg-rose-500 text-white font-black rounded-2xl flex items-center justify-center shadow-lg transform -rotate-12 animate-bounce flex-row">
                404
             </View>
          </View>
          <View className="absolute -bottom-2 -left-2 p-3 bg-amber-400 rounded-2xl shadow-lg animate-pulse">
            <Compass className="w-6 h-6 text-amber-900" />
          </View>
        </View>

        {/* ── Message ── */}
        <View className="space-y-3">
          <Text className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
            Lost in the Deep?
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            You have dived somewhere which <Text className="text-slate-800 dark:text-slate-200 font-bold">no one visits</Text>. It&apos;s a silent void where algorithms dare not tread.
          </Text>
        </View>

        {/* ── Actions ── */}
        <View className="flex flex-col gap-3">
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex-row"
          >
            <Home className="w-5 h-5" />
            Back to Reality
          </Link>
          <View 
            onPress={() => window.history.back()}
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex-row"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </View>
        </View>

        {/* ── Footer ── */}
        <View className="pt-8 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-600 text-xs font-bold uppercase tracking-widest flex-row">
           <Ghost className="w-4 h-4" />
           Unknown Territory
        </View>
      </View>
    </View>
  );
}
